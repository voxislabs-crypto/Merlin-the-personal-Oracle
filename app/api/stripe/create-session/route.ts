import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    let priceId = (await request.json()).priceId;
    
    // If price ID is not provided or doesn't exist, try to find or create it
    if (!priceId || priceId.startsWith('price_1SqIF9')) {
      // Look for existing prices for Merlin product
      const prices = await stripe.prices.list({ limit: 10 });
      const merlinPrice = prices.data.find(p => {
        return p.product && typeof p.product === 'string' && p.unit_amount === 5000; // $50.00 in cents
      });
      
      if (merlinPrice) {
        priceId = merlinPrice.id;
      } else {
        // Create a test product and price if needed
        const product = await stripe.products.create({
          name: 'Merlin - Lifetime Access',
          description: 'Unlock your birth chart and cosmic insights forever',
        });
        
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: 5000, // $50.00
          currency: 'usd',
        });
        
        priceId = price.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout?canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: String(error) },
      { status: 500 }
    );
  }
}
