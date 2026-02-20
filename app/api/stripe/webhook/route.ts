import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { 
  sendTrialEndingEmail, 
  sendPaymentFailedEmail, 
  sendSubscriptionCancelledEmail 
} from '@/lib/email-service';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('your_')) {
    return null;
  }
  try {
    return new Stripe(process.env.STRIPE_SECRET_KEY);
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return null;
  }
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Helper: Get user email from Clerk
 */
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

/**
 * Helper: Decrement spots counter
 */
async function decrementSpots(): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_URL}/api/spots`, {
      method: 'POST',
    });
    console.log('[Webhook] Spots decremented successfully');
  } catch (error) {
    console.error('[Webhook] Failed to decrement spots:', error);
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  
  if (!stripe || !webhookSecret) {
    console.error('[Webhook] Stripe not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }
  
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
      const userId = session.metadata?.userId;
      
      console.log(`[Stripe] Checkout completed: ${session.id}`);
      console.log(`[Stripe] Customer: ${session.customer}`);
      console.log(`[Stripe] Subscription: ${session.subscription}`);
      console.log(`[Stripe] User ID: ${userId}`);

      // Decrement spots counter
      await decrementSpots();

      // Update user metadata in Clerk
      if (userId) {
        try {
          const client = await clerkClient();
          await client.users.updateUser(userId, {
            publicMetadata: {
              subscribed: true,  // ✅ ADDED: Mark user as subscribed
              hasTrial: true,
              stripeCustomerId: session.customer,
              subscriptionId: session.subscription,
              subscriptionStatus: 'trialing',
              checkoutSessionId: session.id,
            },
          });
          console.log(`[Stripe] Updated Clerk metadata for user ${userId}`);
        } catch (error) {
          console.error('[Stripe] Failed to update Clerk metadata:', error);
        }
      }
      break;
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      
      console.log(`[Stripe] Subscription created: ${subscription.id}`);
      console.log(`[Stripe] Status: ${subscription.status}`);
      console.log(`[Stripe] Trial end: ${subscription.trial_end}`);
      console.log(`[Stripe] User ID: ${userId}`);

      // Sync subscription status in Clerk
      if (userId) {
        try {
          const client = await clerkClient();
          await client.users.updateUser(userId, {
            publicMetadata: {
              subscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              trialEnd: subscription.trial_end || null,
              currentPeriodEnd: (subscription as any).current_period_end || null,
            },
          });
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
      console.log(`[Stripe] User ID: ${userId}`);

      // Send email reminder 3 days before trial ends
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

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      
      console.log(`[Stripe] Subscription updated: ${subscription.id}`);
      console.log(`[Stripe] New status: ${subscription.status}`);
      console.log(`[Stripe] User ID: ${userId}`);

      // Sync status change in Clerk (e.g., trialing → active, active → past_due)
      if (userId) {
        try {
          const client = await clerkClient();
          await client.users.updateUser(userId, {
            publicMetadata: {
              subscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              currentPeriodEnd: (subscription as any).current_period_end || null,
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end || false,
            },
          });
          console.log(`[Stripe] Updated subscription status in Clerk: ${subscription.status}`);
        } catch (error) {
          console.error('[Stripe] Failed to update subscription status in Clerk:', error);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      
      console.log(`[Stripe] Subscription cancelled: ${subscription.id}`);
      console.log(`[Stripe] User ID: ${userId}`);

      // Revoke access and update Clerk metadata
      if (userId) {
        try {
          const client = await clerkClient();
          await client.users.updateUser(userId, {
            publicMetadata: {
              subscriptionId: null,
              subscriptionStatus: 'canceled',
              canceledAt: Math.floor(Date.now() / 1000),
              hasTrial: false,
            },
          });
          console.log(`[Stripe] Revoked access for user ${userId}`);
          
          // Send cancellation confirmation email
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
      const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription?.id;
      
      console.log(`[Stripe] Payment succeeded for invoice: ${invoice.id}`);
      console.log(`[Stripe] Subscription: ${subscriptionId}`);

      // If this is a subscription invoice, ensure user has active status
      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = sub.metadata?.userId;
          
          if (userId) {
            const client = await clerkClient();
            await client.users.updateUser(userId, {
              publicMetadata: {
                subscriptionStatus: 'active',
                currentPeriodEnd: (sub as any).current_period_end || null,
                lastPaymentDate: Math.floor(Date.now() / 1000),
              },
            });
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
      const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription?.id;
      
      console.log(`[Stripe] Payment failed for invoice: ${invoice.id}`);
      console.log(`[Stripe] Subscription: ${subscriptionId}`);
      console.log(`[Stripe] Attempt count: ${invoice.attempt_count}`);

      // Send failure email (Stripe auto-retries up to 3 times)
      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = sub.metadata?.userId;
          
          if (userId) {
            // Update status to past_due in Clerk
            const client = await clerkClient();
            await client.users.updateUser(userId, {
              publicMetadata: {
                subscriptionStatus: 'past_due',
                lastPaymentAttempt: Math.floor(Date.now() / 1000),
                paymentAttemptCount: invoice.attempt_count || 0,
              },
            });
            
            // Send payment failed email with invoice link
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
