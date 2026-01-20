import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    const { birthDate, birthTime, birthCity } = await request.json();

    console.log('Creating session for:', { birthDate, birthTime, birthCity });
    console.log('Stripe key exists:', !!process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Merlin - Lifetime Astrological Readings',
              description: 'One-time lifetime access to your personal oracle'
            },
            unit_amount: 5000, // $50.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/dashboard?date=${encodeURIComponent(birthDate)}&time=${encodeURIComponent(birthTime)}&city=${encodeURIComponent(birthCity)}`,
      cancel_url: `${request.nextUrl.origin}/checkout?birthDate=${encodeURIComponent(birthDate)}&birthTime=${encodeURIComponent(birthTime)}&birthCity=${encodeURIComponent(birthCity)}`,
    });

    console.log('Session created:', session.id);

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session', details: (error as Error).message }, { status: 500 });
  }
}