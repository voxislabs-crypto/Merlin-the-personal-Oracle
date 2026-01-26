import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { priceId, birthData } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Store birth data in session metadata
    const metadata: any = {};
    if (birthData) {
      metadata.birthDate = birthData.birthDate || '';
      metadata.birthTime = birthData.birthTime || '';
      metadata.birthCity = birthData.birthCity || '';
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true&date=${encodeURIComponent(birthData?.birthDate || '')}&time=${encodeURIComponent(birthData?.birthTime || '')}&city=${encodeURIComponent(birthData?.birthCity || '')}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}?canceled=true`,
      metadata,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
