import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    console.log('=== Stripe Session Creation Started ===');
    const { priceId, birthData } = await request.json();
    console.log('Request data:', { priceId, birthData });

    if (!priceId) {
      console.error('Missing priceId in request');
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_STRIPE_SUCCESS_URL?.split('/dashboard')[0] || process.env.NEXT_PUBLIC_URL || '';
    console.log('Origin:', origin);
    if (!origin) {
      console.error('Missing origin/NEXT_PUBLIC_URL');
      return NextResponse.json(
        { error: 'Missing application URL configuration' },
        { status: 500 }
      );
    }

    // Store birth data in session metadata
    const metadata: any = {};
    if (birthData) {
      metadata.birthDate = birthData.birthDate || '';
      metadata.birthTime = birthData.birthTime || '';
      metadata.birthCity = birthData.birthCity || '';
    }
    console.log('Metadata:', metadata);

    console.log('Creating Stripe subscription session with 7-day trial...');
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel' // Auto-cancel if no payment method added
          }
        },
        metadata
      },
      success_url: `${process.env.NEXT_PUBLIC_STRIPE_SUCCESS_URL || origin}/dashboard?success=true&trial=true&date=${encodeURIComponent(birthData?.birthDate || '')}&time=${encodeURIComponent(birthData?.birthTime || '')}&city=${encodeURIComponent(birthData?.birthCity || '')}`,
      cancel_url: `${process.env.NEXT_PUBLIC_STRIPE_CANCEL_URL || origin}?canceled=true`,
      metadata,
      allow_promotion_codes: true, // Allow promo codes
    });

    console.log('Session created successfully:', { id: session.id, url: session.url });
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
