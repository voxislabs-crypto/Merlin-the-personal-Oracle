'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OracleChat } from '@/components/astrology/OracleChat';
import type { BirthChartData } from '@/types/astrology';

interface OracleChatModalProps {
  birthChart?: BirthChartData;
  progressedChart?: any;
  userId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'modal';
}

export function OracleChatModal({
  birthChart,
  progressedChart,
  userId = 'anonymous',
  position = 'bottom-right',
}: OracleChatModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (position === 'modal') {
    // Full-screen modal
    return (
      <div>
        {/* Button/trigger */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition"
          aria-label="Open Oracle Chat"
        >
          <MessageCircle size={24} />
        </button>

        {/* Modal */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur z-40"
              />

              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-4 md:inset-8 lg:inset-16 z-50 rounded-lg overflow-hidden shadow-2xl"
              >
                <OracleChat
                  birthChart={birthChart}
                  progressedChart={progressedChart}
                  userId={userId}
                  onClose={() => setIsOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Floating drawer version
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
  };

  return (
    <div>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed ${positionClasses[position]} z-40 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition`}
        aria-label="Toggle Oracle Chat"
      >
        <MessageCircle size={24} />
      </motion.button>

      {/* Floating chat drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400, y: 200 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 400, y: 200 }}
            className={`fixed ${positionClasses[position]} z-50 w-96 h-[600px] rounded-lg shadow-2xl overflow-hidden`}
            style={{ bottom: position.includes('bottom') ? 80 : 'auto', top: position.includes('top') ? 16 : 'auto' }}
          >
            <OracleChat
              birthChart={birthChart}
              progressedChart={progressedChart}
              userId={userId}
              onClose={() => setIsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
