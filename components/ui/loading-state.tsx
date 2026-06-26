'use client';

import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  variant?: 'default' | 'minimal' | 'chart';
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  message = 'Loading your cosmic data...',
  variant = 'default',
  size = 'md',
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-amber-400`} />
        {message && <span className={`text-gray-400 ${textSizeClasses[size]}`}>{message}</span>}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="relative mb-6"
        >
          <Sparkles className={`${sizeClasses[size]} text-amber-400`} />
          <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl"></div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`text-amber-300 ${textSizeClasses[size]} font-semibold mb-2`}
        >
          {message}
        </motion.p>
        <p className="text-gray-500 text-sm">This may take a few moments...</p>
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="mb-6"
      >
        <div className={`${sizeClasses[size]} rounded-full border-4 border-amber-400/20 border-t-amber-400`}></div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`text-amber-300 ${textSizeClasses[size]} font-semibold text-center`}
      >
        {message}
      </motion.p>
    </div>
  );
}

export function LoadingOverlay({ message = 'Processing...' }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <LoadingState message={message} variant="chart" size="lg" />
    </motion.div>
  );
}
