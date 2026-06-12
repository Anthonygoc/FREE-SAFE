import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type Tone = 'orange' | 'green' | 'amber' | 'red' | 'zinc';
type Size = 'sm' | 'md' | 'lg';

const toneClasses: Record<Tone, string> = {
  orange: 'bg-orange-50 text-orange-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  zinc: 'bg-zinc-100 text-zinc-600',
};

const sizeClasses: Record<Size, string> = {
  sm: 'p-2',
  md: 'p-2.5',
  lg: 'p-3',
};

const iconSizeClasses: Record<Size, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

type IconBadgeProps = {
  icon: LucideIcon;
  tone?: Tone;
  size?: Size;
};

export function IconBadge({ icon: Icon, tone = 'orange', size = 'md' }: IconBadgeProps) {
  return (
    <span className={cn('inline-flex rounded-xl', toneClasses[tone], sizeClasses[size])}>
      <Icon className={iconSizeClasses[size]} strokeWidth={2} />
    </span>
  );
}
