'use client';

import { UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Please sign in to view your profile</p>
          <Link
            href="/sign-in"
            className="text-amber-400 hover:text-amber-300 underline"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-amber-300 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-between items-center mb-12"
        >
          <h1 className="text-4xl font-bold text-amber-400">Your Profile</h1>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-12 h-12",
              },
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-black/50 backdrop-blur-sm border border-amber-800 rounded-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-amber-300 mb-6">Account Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-400 text-sm">Full Name</label>
              <p className="text-lg text-white mt-1">
                {user.firstName} {user.lastName}
              </p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Email</label>
              <p className="text-lg text-white mt-1">
                {user.emailAddresses[0]?.emailAddress}
              </p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">User ID</label>
              <p className="text-lg text-white mt-1 font-mono text-sm">
                {user.id}
              </p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Account Created</label>
              <p className="text-lg text-white mt-1">
                {new Date(user.createdAt || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex gap-4"
        >
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
          >
            Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
