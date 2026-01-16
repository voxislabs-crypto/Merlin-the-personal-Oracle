'use client';

import { loadStripe } from '@stripe/stripe-js';
import { useState, useEffect } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [spots, setSpots] = useState(47);

  useEffect(() => {
    fetch('/api/spots').then(r => r.json()).then(d => setSpots(d.spotsLeft));
  }, []);

  const handlePay = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6 text-white">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-5xl font-bold text-amber-400">Merlin</h1>
        <p className="text-2xl font-light">Lifetime Access</p>
        <p className="text-lg text-amber-300">Unlock your birth chart forever</p>

        <div className="bg-slate-800/50 border border-amber-500/30 rounded-lg p-8 my-8">
          <p className="text-5xl font-bold text-amber-400 mb-2">$50</p>
          <p className="text-sm text-gray-400">one-time payment</p>
          <p className="text-amber-300 mt-6 text-lg font-semibold">Only {spots} spots left</p>
        </div>

        <ul className="text-left space-y-3 text-gray-300 mb-8">
          <li className="flex items-start">
            <span className="text-amber-400 mr-3 mt-1">✓</span>
            <span>Lifetime access to your birth chart</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-400 mr-3 mt-1">✓</span>
            <span>Daily personalized cosmic insights</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-400 mr-3 mt-1">✓</span>
            <span>Real-time transit tracking</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-400 mr-3 mt-1">✓</span>
            <span>Professional Swiss Ephemeris calculations</span>
          </li>
        </ul>

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition shadow-lg"
        >
          {loading ? 'Processing...' : 'Pay $50 Now'}
        </button>

        <p className="text-xs text-gray-500">
          Test card: 4242 4242 4242 4242 (Exp: any future date, CVC: any 3 digits)
        </p>
      </div>
    </div>
  );
}
