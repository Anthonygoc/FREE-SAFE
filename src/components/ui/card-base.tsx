'use client';

import { motion } from 'framer-motion';

export function CardBase({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </motion.div>
  );
}
