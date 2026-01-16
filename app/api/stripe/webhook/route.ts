import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')!;
  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    // Decrement spots counter on successful payment
    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL}/api/spots`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to decrement spots:', err);
    }
  }

  return new Response('ok');
}
