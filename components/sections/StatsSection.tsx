'use client';

import { motion } from 'framer-motion';
import { Users, Star, Clock, TrendingUp } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '2,400+',
    label: 'Active Users',
  },
  {
    icon: Star,
    value: '4.9/5',
    label: 'Average Rating',
  },
  {
    icon: Clock,
    value: '50K+',
    label: 'Charts Calculated',
  },
  {
    icon: TrendingUp,
    value: '98%',
    label: 'Accuracy Rate',
  },
];

export function StatsSection() {
  return (
    <section className="py-16 px-4 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-amber-300 mb-1">
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
