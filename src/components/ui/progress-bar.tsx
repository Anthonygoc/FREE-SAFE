'use client';
import { motion } from 'framer-motion';

type ProgressBarProps = {
  value: number;
  tone?: 'orange' | 'emerald' | 'amber' | 'red';
};

const toneColors = {
  orange: '#f97316',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
} as const;

export function ProgressBar({ value, tone = 'orange' }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-zinc-100"
      style={{ height: 6 }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clampedValue}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ height: 6, backgroundColor: toneColors[tone], borderRadius: 9999 }}
      />
    </div>
  );
}
