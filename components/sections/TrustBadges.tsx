'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Zap, CheckCircle2 } from 'lucide-react';

const badges = [
  {
    icon: Shield,
    text: 'Swiss Ephemeris Precision',
  },
  {
    icon: Lock,
    text: 'Secure Payment',
  },
  {
    icon: Zap,
    text: 'Instant Access',
  },
  {
    icon: CheckCircle2,
    text: 'Lifetime Guarantee',
  },
];

export function TrustBadges() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex flex-wrap items-center justify-center gap-6 py-8"
    >
      {badges.map((badge, index) => (
        <div
          key={index}
          className="flex items-center gap-2 text-gray-400 text-sm"
        >
          <badge.icon className="w-4 h-4 text-amber-400" />
          <span>{badge.text}</span>
        </div>
      ))}
    </motion.div>
  );
}
