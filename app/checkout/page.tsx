"use client";

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
    const response = await fetch('/api/stripe/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID }),
    });
    const { sessionId } = await response.json();
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId });
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6 text-white">
      <h1 className="text-5xl font-bold mb-8 text-amber-400">Merlin</h1>
      <p className="text-2xl mb-4">Lifetime Access</p>
      <p className="text-xl mb-12 text-amber-300">Only {spots} spots left — forever</p>
      <button
        onClick={handlePay}
        disabled={loading}
        className="bg-green-700 hover:bg-green-600 text-white font-bold py-6 px-12 rounded-xl text-3xl transition shadow-lg disabled:bg-gray-600"
      >
        {loading ? 'Processing...' : 'Pay $50 Now'}
      </button>
      <p className="text-xs text-gray-500 mt-4">
        Test card: 4242 4242 4242 4242 (Exp: any future date, CVC: any 3 digits)
      </p>
    </div>
  );
}
