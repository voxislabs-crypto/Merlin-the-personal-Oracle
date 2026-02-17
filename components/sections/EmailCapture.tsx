'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2, Loader2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trackLead } from '@/lib/analytics';

interface EmailCaptureProps {
  variant?: 'default' | 'compact' | 'modal';
  title?: string;
  description?: string;
  incentive?: string;
  placeholder?: string;
  className?: string;
}

export function EmailCapture({
  variant = 'default',
  title = 'Get Your Free Birth Chart Sample',
  description = 'Enter your email to receive a free sample birth chart interpretation and exclusive early access pricing.',
  incentive = '🎁 Plus: Get a $10 discount code for lifetime access',
  placeholder = 'Enter your email address',
  className = '',
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // TODO: Replace with your actual email capture API endpoint
      // Options: Mailchimp, ConvertKit, Klaviyo, or custom database
      const response = await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      setStatus('success');
      trackLead(); // Track conversion
      
      // Store email in localStorage for later conversion tracking
      localStorage.setItem('merlin_lead_email', email);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setEmail('');
        setStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Email capture error:', error);
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex flex-col items-center justify-center p-8 bg-green-900/20 border border-green-500/30 rounded-xl ${className}`}
      >
        <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
        <h3 className="text-2xl font-bold text-green-300 mb-2">You&apos;re In!</h3>
        <p className="text-gray-300 text-center">
          Check your email for your free sample and discount code.
        </p>
      </motion.div>
    );
  }

  const isCompact = variant === 'compact';
  const isModal = variant === 'modal';

  return (
    <div className={`${isModal ? 'max-w-md mx-auto' : ''} ${className}`}>
      {!isCompact && (
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-amber-300 mb-2">
            {title}
          </h3>
          <p className="text-gray-400">
            {description}
          </p>
          {incentive && (
            <div className="inline-flex items-center gap-2 bg-amber-900/30 border border-amber-500/30 rounded-lg px-4 py-2 mt-4">
              <Gift className="w-4 h-4 text-amber-400" />
              <span className="text-amber-200 text-sm font-semibold">{incentive}</span>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`flex ${isCompact ? 'flex-row gap-2' : 'flex-col gap-3'}`}>
          <Input
            type="email"
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
            className={`bg-gray-900/50 border-amber-500/30 text-white placeholder:text-gray-500 ${
              status === 'error' ? 'border-red-500/50' : ''
            } ${isCompact ? 'flex-1' : ''}`}
          />
          <Button
            type="submit"
            disabled={status === 'loading'}
            className={`bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold ${
              isCompact ? '' : 'w-full'
            }`}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                {isCompact ? 'Get Sample' : 'Get My Free Sample'}
                <Mail className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {status === 'error' && errorMessage && (
          <p className="text-red-400 text-sm text-center">{errorMessage}</p>
        )}

        <p className="text-gray-500 text-xs text-center">
          We respect your privacy. Unsubscribe anytime.
        </p>
      </form>
    </div>
  );
}
