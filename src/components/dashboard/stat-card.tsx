'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { CardBase } from '@/components/ui/card-base';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
}) {
  return (
    <CardBase>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-zinc-900">{value}</p>
          {subtitle ? <p className="mt-2 text-xs text-zinc-500">{subtitle}</p> : null}
        </div>
        <div className="rounded-2xl bg-orange-100 p-3 text-orange-500">
          <Icon className="h-5 w-5" />
        </div>
      </motion.div>
    </CardBase>
  );
}
