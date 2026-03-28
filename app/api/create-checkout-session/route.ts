import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const getCheckoutUrls = (req: NextRequest) => {
  const origin = req.headers.get('origin') || req.nextUrl.origin || process.env.NEXT_PUBLIC_URL || '';
  const successUrl = process.env.NEXT_PUBLIC_STRIPE_SUCCESS_URL || `${origin}/dashboard`;
  const cancelUrl = process.env.NEXT_PUBLIC_STRIPE_CANCEL_URL || origin;

  return {
    successUrl,
    cancelUrl,
  };
};

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      console.error('Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: "Stripe is not configured on the server" }, { status: 500 });
    }

    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      console.error('Missing NEXT_PUBLIC_STRIPE_PRICE_MONTHLY');
      return NextResponse.json({ error: "Monthly subscription is not configured" }, { status: 500 });
    }

    const { birthDate, birthTime, birthCity } = await request.json();
    const { successUrl, cancelUrl } = getCheckoutUrls(request);
    const successRedirectUrl = new URL(successUrl);
    successRedirectUrl.searchParams.set('success', 'true');
    successRedirectUrl.searchParams.set('trial', 'true');
    successRedirectUrl.searchParams.set('date', birthDate || '');
    successRedirectUrl.searchParams.set('time', birthTime || '');
    successRedirectUrl.searchParams.set('city', birthCity || '');

    const cancelRedirectUrl = new URL(cancelUrl);
    cancelRedirectUrl.searchParams.set('canceled', 'true');

    console.log('Creating subscription session for user:', userId);
    console.log('Birth data:', { birthDate, birthTime, birthCity });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel'
          }
        },
        metadata: {
          userId,
          birthDate: birthDate || '',
          birthTime: birthTime || '',
          birthCity: birthCity || '',
        }
      },
      success_url: successRedirectUrl.toString(),
      cancel_url: cancelRedirectUrl.toString(),
      metadata: {
        userId,
        tier: 'monthly',
      },
      allow_promotion_codes: true, // Enable promo codes at checkout
    });

    console.log('Session created:', session.id);

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: (error as Error).message },
      { status: 500 }
    );
  }
}