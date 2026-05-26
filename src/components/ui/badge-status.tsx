'use client';

import { motion } from 'framer-motion';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const toneClasses: Record<Tone, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  neutral: 'bg-zinc-100 text-zinc-700',
};

export function BadgeStatus({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {label}
    </motion.span>
  );
}
