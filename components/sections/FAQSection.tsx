'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'How accurate are the birth chart calculations?',
    answer: 'Merlin uses the Swiss Ephemeris, the gold standard in professional astrology. The same precision used by NASA for astronomical calculations. Your chart is accurate to the second.',
  },
  {
    question: 'What pricing options do you offer?',
    answer: 'You can start with a 7-day free trial at $9.99/month or choose $50 one-time lifetime access. Pick the path that fits your style. No hidden fees.',
  },
  {
    question: 'What makes Merlin different from free astrology apps?',
    answer: 'Most free apps use simplified calculations and generic interpretations. Merlin combines Swiss Ephemeris precision, AI-powered personalized insights, MBTI integration, real-time transits, and professional-grade features typically found in $300+ software.',
  },
  {
    question: 'Do I need my exact birth time?',
    answer: 'For the most accurate chart, yes. But if you don\'t know it, we can still calculate your chart with an estimated or noon time. The planetary positions will be accurate, though house placements may vary.',
  },
  {
    question: 'Can I calculate charts for other people?',
    answer: 'Absolutely! Calculate unlimited charts for family, friends, or clients. No restrictions on how many charts you can generate.',
  },
  {
    question: 'What if I\'m not satisfied?',
    answer: '30-day money-back guarantee. If Merlin doesn\'t exceed your expectations, email us for a full refund. No questions asked.',
  },
  {
    question: 'Is my personal data secure?',
    answer: 'Yes. Your birth data is encrypted and never shared. We use industry-standard security practices and comply with all data protection regulations.',
  },
  {
    question: 'Does this work on mobile?',
    answer: 'Yes! Merlin is a Progressive Web App (PWA) that works beautifully on desktop, tablet, and mobile. Install it to your home screen for a native app experience.',
  },
];

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="bg-gray-900/40 backdrop-blur-sm border border-amber-500/20 rounded-xl overflow-hidden hover:border-amber-500/40 transition-all duration-300"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left gap-4 group"
      >
        <span className="text-amber-300 font-semibold group-hover:text-amber-200 transition-colors">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-amber-400 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-4 text-gray-400 leading-relaxed">
          {answer}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FAQSection() {
  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 text-lg">
            Everything you need to know about Merlin
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} {...faq} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
