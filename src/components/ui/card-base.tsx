'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

export function CardBase({
  children,
  className = '',
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={interactive ? { type: 'spring', stiffness: 300 } : undefined}
      className={cn(
        'rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm',
        interactive && 'cursor-pointer transition-all hover:border-zinc-300 hover:shadow-md',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
