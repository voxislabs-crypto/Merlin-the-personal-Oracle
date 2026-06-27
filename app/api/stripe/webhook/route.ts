import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import {
  buildCheckoutCompletedMetadata,
  buildPaymentFailedMetadata,
  buildPaymentSucceededMetadata,
  buildSubscriptionDeletedMetadata,
  buildSubscriptionSyncMetadata,
  mergeClerkPublicMetadata,
} from '@/lib/stripe-clerk-sync';
import { clearTierCache } from '@/lib/subscription-validation';
import {
  sendTrialEndingEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/email-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.emailAddresses[0]?.emailAddress || null;
  } catch (error) {
    console.error('[Webhook] Failed to fetch user email:', error);
    return null;
  }
}

async function syncClerkMetadata(userId: string, patch: Record<string, unknown>): Promise<void> {
  await mergeClerkPublicMetadata(userId, patch);
  clearTierCache(userId);
}

async function updateUserForCompletedCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.warn('[Stripe] Checkout completed without userId metadata');
    return;
  }

  try {
    const patch = buildCheckoutCompletedMetadata(session);
    await syncClerkMetadata(userId, patch);
    console.log(`[Stripe] Synced checkout metadata for user ${userId} (tier: ${patch.tier})`);
  } catch (error) {
    console.error('[Stripe] Failed to update Clerk metadata:', error);
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Event type: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe] Checkout completed: ${session.id}`);
      await updateUserForCompletedCheckout(session);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      console.log(`[Stripe] Subscription ${event.type}: ${subscription.id} (${subscription.status})`);

      if (userId) {
        try {
          await syncClerkMetadata(userId, buildSubscriptionSyncMetadata(subscription));
          console.log(`[Stripe] Synced subscription to Clerk for user ${userId}`);
        } catch (error) {
          console.error('[Stripe] Failed to sync subscription to Clerk:', error);
        }
      }
      break;
    }

    case 'customer.subscription.trial_will_end': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      console.log(`[Stripe] Trial ending soon for: ${subscription.id}`);

      if (userId) {
        const email = await getUserEmail(userId);
        if (email && subscription.trial_end) {
          const trialEndDate = new Date(subscription.trial_end * 1000);
          const sent = await sendTrialEndingEmail(email, trialEndDate);
          console.log(`[Stripe] Trial ending email ${sent ? 'sent' : 'failed'} to ${email}`);
        } else {
          console.error('[Stripe] Missing email or trial_end date for trial ending notification');
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      console.log(`[Stripe] Subscription cancelled: ${subscription.id}`);

      if (userId) {
        try {
          await syncClerkMetadata(userId, buildSubscriptionDeletedMetadata());
          console.log(`[Stripe] Revoked access for user ${userId}`);

          const email = await getUserEmail(userId);
          if (email) {
            const sent = await sendSubscriptionCancelledEmail(email);
            console.log(`[Stripe] Cancellation email ${sent ? 'sent' : 'failed'} to ${email}`);
          }
        } catch (error) {
          console.error('[Stripe] Failed to revoke access in Clerk:', error);
        }
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;

      console.log(`[Stripe] Payment succeeded for invoice: ${invoice.id}`);

      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = sub.metadata?.userId;

          if (userId) {
            await syncClerkMetadata(userId, buildPaymentSucceededMetadata(sub));
            console.log(`[Stripe] Extended access for user ${userId} after successful payment`);
          }
        } catch (error) {
          console.error('[Stripe] Failed to extend access after payment:', error);
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;

      console.log(`[Stripe] Payment failed for invoice: ${invoice.id}`);

      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = sub.metadata?.userId;

          if (userId) {
            await syncClerkMetadata(userId, buildPaymentFailedMetadata(invoice));

            const email = await getUserEmail(userId);
            if (email) {
              const sent = await sendPaymentFailedEmail(email, invoice.hosted_invoice_url || undefined);
              console.log(`[Stripe] Payment failed email ${sent ? 'sent' : 'failed'} to ${email}`);
            }
          }
        } catch (error) {
          console.error('[Stripe] Failed to handle payment failure:', error);
        }
      }
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}