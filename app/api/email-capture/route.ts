import { NextRequest, NextResponse } from 'next/server';

/**
 * Email Capture API Endpoint
 * 
 * TODO: Integrate with your email service provider:
 * - Mailchimp: https://mailchimp.com/developer/
 * - ConvertKit: https://developers.convertkit.com/
 * - Klaviyo: https://developers.klaviyo.com/
 * - Or store in your database for later export
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.log('📧 Email captured:', email);

    // TODO: Integrate with your email service
    // Example for Mailchimp:
    /*
    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
    const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
    const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX; // e.g., 'us6'

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) {
      throw new Error('Mailchimp credentials not configured');
    }

    const response = await fetch(
      `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          tags: ['merlin_lead'],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to subscribe');
    }
    */

    // For now, just log it (in production, store in database or send to email service)
    // You could also write to a CSV file or database here

    return NextResponse.json({
      success: true,
      message: 'Email captured successfully',
    });
  } catch (error: any) {
    console.error('Email capture error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
