import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type Tone = 'green' | 'yellow' | 'red' | 'orange' | 'dark' | 'default' | 'emerald' | 'blue';
type Size = 'sm' | 'md';

const toneClasses: Record<Tone, string> = {
  default: 'bg-zinc-100 text-zinc-700',
  green: 'bg-emerald-100 text-emerald-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  blue: 'bg-blue-100 text-blue-700',
  dark: 'bg-zinc-800 text-white',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
};

interface BadgeStatusProps {
  label: string;
  tone?: Tone;
  icon?: LucideIcon;
  size?: Size;
}

export function BadgeStatus({ label, tone = 'default', icon: Icon, size = 'md' }: BadgeStatusProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full font-semibold', toneClasses[tone], sizeClasses[size])}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      <span>{label}</span>
    </span>
  );
}
