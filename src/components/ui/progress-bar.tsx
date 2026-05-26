'use client';

import { motion } from 'framer-motion';

export function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${safeValue}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="h-full rounded-full bg-orange-500"
      />
    </div>
  );
}
