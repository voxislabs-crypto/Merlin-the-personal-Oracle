'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'What is Merlin, in one sentence?',
    answer:
      'Merlin is personalized life weather for your chart — how today feels, what’s building, and a clear move — with a full birth chart and dual MBTI underneath so every forecast is yours.',
  },
  {
    question: 'How is this different from a free horoscope app?',
    answer:
      'Generic apps lead with sun-sign blurbs. Merlin leads with life weather: intensity, storms, pressure windows, and reality-check against how you actually feel. Self (wheel, placements, MBTI) is depth you can explore, not the only product.',
  },
  {
    question: 'Do I need a birth chart to get life weather?',
    answer:
      'Yes — birth data is how the weather gets personal. Enter date, time, and place once. Merlin builds your Self map, then uses it for every life-weather forecast. Without a chart, you’re back to generic horoscope noise.',
  },
  {
    question: 'How accurate are the calculations?',
    answer:
      'Chart positions use Swiss Ephemeris — professional-grade astronomy, not party-app shortcuts. Forecasts compose transits, pressure, and storms into one Atmosphere packet. Still interpretive; we don’t claim medical or financial certainty.',
  },
  {
    question: 'What pricing options do you offer?',
    answer:
      'Free includes chart, dual MBTI, a Today life-weather sample, and 3 Oracle messages per day. Paid unlocks unlimited Oracle, storm radar, weekly horizon, full forecast depth, and timeline. 7-day free trial then $9.99/month, or $50 lifetime (founder pricing while in beta).',
  },
  {
    question: 'Do I need my exact birth time?',
    answer:
      'Best results need an exact time (houses and rising depend on it). No time? We can still work from noon or an estimate — planets stay solid; house-based nuance is softer.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Birth data is treated as sensitive personal context. We use industry-standard auth and practices and don’t sell your chart. See Privacy Policy for details.',
  },
  {
    question: 'Does this work on mobile?',
    answer:
      'Yes. Merlin is a Progressive Web App — desktop, tablet, and phone. Install to home screen for a native-like daily weather check.',
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
      className="bg-slate-950/50 backdrop-blur-sm border border-sky-500/15 rounded-xl overflow-hidden hover:border-sky-400/35 transition-all duration-300"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left gap-4 group"
      >
        <span className="text-sky-100/95 font-semibold group-hover:text-sky-50 transition-colors">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-sky-400 flex-shrink-0 transition-transform duration-300 ${
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
        <div className="px-6 pb-4 text-slate-400 leading-relaxed">{answer}</div>
      </motion.div>
    </motion.div>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="py-20 px-4 relative">
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-300 bg-clip-text text-transparent mb-4">
            Questions
          </h2>
          <p className="text-slate-400 text-lg">Life weather, Self chart, pricing — straight answers.</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={faq.question} {...faq} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
