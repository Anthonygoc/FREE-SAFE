'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type CardBaseProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'sm' | 'md' | 'lg';
};

const paddingClasses = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
} as const;

export function CardBase({
  children,
  className = '',
  interactive = false,
  padding = 'md',
}: CardBaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={interactive ? { type: 'spring', stiffness: 300 } : { duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'rounded-2xl border border-zinc-200 bg-white shadow-sm',
        paddingClasses[padding],
        interactive && 'cursor-pointer transition-all hover:border-zinc-300 hover:shadow-md',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
