import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

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

    // Handle subscription events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[Stripe] Checkout completed: ${session.id}`);
        console.log(`[Stripe] Customer: ${session.customer}`);
        console.log(`[Stripe] Subscription: ${session.subscription}`);
        
        // Decrement spots counter on successful payment
        try {
          await fetch(`${process.env.NEXT_PUBLIC_URL}/api/spots`, {
            method: 'POST',
          });
        } catch (err) {
          console.error('Failed to decrement spots:', err);
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe] Subscription created: ${subscription.id}`);
        console.log(`[Stripe] Status: ${subscription.status}`);
        console.log(`[Stripe] Trial end: ${subscription.trial_end}`);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe] Trial ending soon for: ${subscription.id}`);
        // TODO: Send email reminder about trial ending
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe] Subscription updated: ${subscription.id}`);
        console.log(`[Stripe] New status: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe] Subscription cancelled: ${subscription.id}`);
        // TODO: Revoke user access in database
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe] Payment succeeded for invoice: ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe] Payment failed for invoice: ${invoice.id}`);
        // TODO: Send payment failure email
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
