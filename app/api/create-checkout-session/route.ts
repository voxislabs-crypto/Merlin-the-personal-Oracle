import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { birthDate, birthTime, birthCity } = await request.json();

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
      success_url: `${request.nextUrl.origin}/dashboard?success=true&trial=true&date=${encodeURIComponent(birthDate || '')}&time=${encodeURIComponent(birthTime || '')}&city=${encodeURIComponent(birthCity || '')}`,
      cancel_url: `${request.nextUrl.origin}/?canceled=true`,
      metadata: {
        userId,
      },
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