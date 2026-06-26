'use client';

import { motion } from 'framer-motion';
import { AlertCircle, XCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorStateProps {
  title?: string;
  message?: string;
  variant?: 'error' | 'warning' | 'notFound';
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export function ErrorState({
  title,
  message,
  variant = 'error',
  onRetry,
  showHomeButton = true,
}: ErrorStateProps) {
  const variants = {
    error: {
      icon: XCircle,
      iconColor: 'text-red-400',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-500/30',
      defaultTitle: 'Something Went Wrong',
      defaultMessage: 'We encountered an unexpected error. Please try again.',
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-900/20',
      borderColor: 'border-amber-500/30',
      defaultTitle: 'Heads Up',
      defaultMessage: 'There was an issue processing your request.',
    },
    notFound: {
      icon: AlertCircle,
      iconColor: 'text-gray-400',
      bgColor: 'bg-gray-900/40',
      borderColor: 'border-gray-500/30',
      defaultTitle: '404 - Not Found',
      defaultMessage: 'The page you\'re looking for doesn\'t exist.',
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-8"
    >
      <div className={`${config.bgColor} ${config.borderColor} border rounded-2xl p-8 max-w-md w-full text-center`}>
        <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-8 h-8 ${config.iconColor}`} />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {title || config.defaultTitle}
        </h2>

        <p className="text-gray-400 mb-6">
          {message || config.defaultMessage}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}

          {showHomeButton && (
            <Link href="/">
              <Button variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-900/20 w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Inline error message for forms and smaller components
 */
export function InlineError({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
}
