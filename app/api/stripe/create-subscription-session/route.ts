import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const getCheckoutUrls = (request: Request) => {
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_URL || '';
  const successUrl = process.env.NEXT_PUBLIC_STRIPE_SUCCESS_URL || `${origin}/dashboard`;
  const cancelUrl = process.env.NEXT_PUBLIC_STRIPE_CANCEL_URL || origin;

  return { origin, successUrl, cancelUrl };
};

export async function POST(request: Request) {
  try {
    console.log('=== Stripe Subscription Session Creation Started ===');
    if (!stripe) {
      console.error('Missing STRIPE_SECRET_KEY');
      return NextResponse.json(
        { error: 'Stripe is not configured on the server' },
        { status: 500 }
      );
    }

    const { priceId, birthData, userEmail } = await request.json();
    console.log('Request data:', { priceId, birthData, userEmail });

    if (!priceId) {
      console.error('Missing priceId in request');
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    const { origin, successUrl, cancelUrl } = getCheckoutUrls(request);
    console.log('Origin:', origin);
    if (!origin) {
      console.error('Missing origin/NEXT_PUBLIC_URL');
      return NextResponse.json(
        { error: 'Missing application URL configuration' },
        { status: 500 }
      );
    }

    // Store birth data in session metadata
    const metadata: any = { tier: 'monthly' };
    if (birthData) {
      metadata.birthDate = birthData.birthDate || '';
      metadata.birthTime = birthData.birthTime || '';
      metadata.birthCity = birthData.birthCity || '';
    }
    if (userEmail) {
      metadata.userEmail = userEmail;
    }
    console.log('Metadata:', metadata);
    console.log('Price ID being used:', priceId);
    console.log('Env var check:', process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY);
    console.log('Creating Stripe subscription session with 7-day trial...');
    const successRedirectUrl = new URL(successUrl);
    successRedirectUrl.searchParams.set('success', 'true');
    successRedirectUrl.searchParams.set('trial', 'true');
    successRedirectUrl.searchParams.set('date', birthData?.birthDate || '');
    successRedirectUrl.searchParams.set('time', birthData?.birthTime || '');
    successRedirectUrl.searchParams.set('city', birthData?.birthCity || '');

    const cancelRedirectUrl = new URL(cancelUrl);
    cancelRedirectUrl.searchParams.set('canceled', 'true');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ 
        price: priceId, 
        quantity: 1 
      }],
      subscription_data: {
        trial_period_days: 7,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel' // Auto-cancel if no payment method added
          }
        },
        metadata
      },
      success_url: successRedirectUrl.toString(),
      cancel_url: cancelRedirectUrl.toString(),
      metadata,
      allow_promotion_codes: true, // Allow promo codes
    });

    console.log('Subscription session created successfully:', { id: session.id, url: session.url });
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe subscription session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription checkout session' },
      { status: 500 }
    );
  }
}
