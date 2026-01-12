'use client';

import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe('pk_test_your_pub_key_here'); // Replace with actual test key

export default function Checkout() {
  const router = useRouter();

  const handlePay = async () => {
    // For demo purposes, simulate payment success
    localStorage.setItem('merlin_paid', 'true');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-amber-400 mb-8">One-Time Lifetime Access</h1>
        <p className="text-xl text-gray-300 mb-8">Never pay again.</p>

        <button
          onClick={handlePay}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 text-2xl rounded-lg transition duration-300 mb-8"
        >
          Pay $50 Now
        </button>

        <p className="text-lg text-gray-400">Only 47 spots left. Then it's gone forever.</p>
      </div>
    </div>
  );
}