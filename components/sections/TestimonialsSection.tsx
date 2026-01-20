'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah M.',
    type: 'INTJ - The Architect',
    text: 'Finally, astrology that respects my intelligence. The precision is unmatched.',
    rating: 5,
  },
  {
    name: 'Marcus R.',
    type: 'ENFP - The Campaigner',
    text: 'The daily whispers are eerily accurate. It\'s like having a cosmic therapist.',
    rating: 5,
  },
  {
    name: 'Luna K.',
    type: 'INFJ - The Advocate',
    text: 'The MBTI integration is brilliant. This is what astrology should always have been.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent mb-4">
            What Our Users Say
          </h2>
          <p className="text-gray-400 text-lg">
            Join the enlightened few who&apos;ve discovered their cosmic truth
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-gray-900/40 backdrop-blur-sm border border-amber-500/20 rounded-xl p-6 hover:border-amber-500/40 transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              
              <p className="text-gray-300 mb-4 italic">
                &quot;{testimonial.text}&quot;
              </p>
              
              <div className="border-t border-amber-500/20 pt-4">
                <p className="text-amber-300 font-semibold">{testimonial.name}</p>
                <p className="text-gray-400 text-sm">{testimonial.type}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
