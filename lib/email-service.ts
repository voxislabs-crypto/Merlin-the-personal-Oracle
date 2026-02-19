/**
 * Email Service for Merlin Oracle
 * Supports multiple providers: Resend (recommended), console logging (dev)
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email using the configured provider
 * Currently supports: Resend API, or console logging for development
 */
export async function sendEmail({ to, subject, html, from }: EmailParams): Promise<boolean> {
  const fromEmail = from || process.env.EMAIL_FROM || 'noreply@merlinoracle.com';

  // If Resend API key is configured, use Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Email Service] Resend API error:', error);
        return false;
      }

      const data = await response.json();
      console.log('[Email Service] Email sent via Resend:', data.id);
      return true;
    } catch (error) {
      console.error('[Email Service] Failed to send email via Resend:', error);
      return false;
    }
  }

  // Fallback: Log email to console (useful for development)
  console.log('[Email Service] EMAIL (no provider configured):');
  console.log('─'.repeat(80));
  console.log(`To: ${to}`);
  console.log(`From: ${fromEmail}`);
  console.log(`Subject: ${subject}`);
  console.log('─'.repeat(80));
  console.log(html);
  console.log('─'.repeat(80));
  
  return true;
}

/**
 * Send trial ending reminder email (3 days before trial ends)
 */
export async function sendTrialEndingEmail(email: string, trialEndDate: Date): Promise<boolean> {
  const formattedDate = trialEndDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">✨ Your Trial is Ending Soon</h1>
        </div>
        
        <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hello there! 👋</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Your free 7-day trial of <strong>Merlin Oracle</strong> will end on <strong>${formattedDate}</strong>.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            We hope you've been enjoying your personalized astrological insights! Your subscription will automatically continue at just $9.99/month, giving you unlimited access to:
          </p>
          
          <ul style="font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
            <li>Daily personalized forecasts</li>
            <li>Advanced birth chart analysis</li>
            <li>Transit tracking and predictions</li>
            <li>Unlimited chart calculations</li>
          </ul>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            If you'd like to cancel before the trial ends, you can manage your subscription anytime in your dashboard.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_URL}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            Questions? Just reply to this email and we'll be happy to help.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>Merlin Oracle - Your Personal Astrology Assistant</p>
          <p>${process.env.NEXT_PUBLIC_URL}</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '✨ Your free trial ends soon - Continue your cosmic journey',
    html,
  });
}

/**
 * Send payment failed notification email
 */
export async function sendPaymentFailedEmail(email: string, invoiceUrl?: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">⚠️ Payment Failed</h1>
        </div>
        
        <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            We attempted to process your payment for <strong>Merlin Oracle</strong>, but unfortunately it didn't go through.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>Common reasons for payment failures:</strong>
          </p>
          
          <ul style="font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
            <li>Expired card</li>
            <li>Insufficient funds</li>
            <li>Card declined by your bank</li>
            <li>Incorrect billing information</li>
          </ul>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            <strong>What happens next?</strong><br>
            Stripe will automatically retry your payment up to 3 times over the next few days. To avoid any interruption in service, please update your payment method as soon as possible.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            ${invoiceUrl ? `
              <a href="${invoiceUrl}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-bottom: 15px;">
                Update Payment Method
              </a>
              <br>
            ` : ''}
            <a href="${process.env.NEXT_PUBLIC_URL}/dashboard" style="background: #667eea; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            Need help? Just reply to this email and we'll assist you right away.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>Merlin Oracle - Your Personal Astrology Assistant</p>
          <p>${process.env.NEXT_PUBLIC_URL}</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '⚠️ Payment failed - Action required',
    html,
  });
}

/**
 * Send subscription cancelled confirmation email
 */
export async function sendSubscriptionCancelledEmail(email: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">Subscription Cancelled</h1>
        </div>
        
        <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Your <strong>Merlin Oracle</strong> subscription has been cancelled as requested.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            We're sorry to see you go! If you have any feedback about your experience, we'd love to hear from you - just reply to this email.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            You can resubscribe anytime by visiting your dashboard. We'll be here whenever you're ready to continue your cosmic journey! ✨
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_URL}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Return to Merlin Oracle
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            Questions? Just reply to this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>Merlin Oracle - Your Personal Astrology Assistant</p>
          <p>${process.env.NEXT_PUBLIC_URL}</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Your subscription has been cancelled',
    html,
  });
}
