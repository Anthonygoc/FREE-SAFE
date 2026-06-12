import type { LucideIcon } from 'lucide-react';

import { CardBase } from '@/components/ui/card-base';
import { IconBadge } from '@/components/ui/icon-badge';

type Tone = 'orange' | 'green' | 'yellow' | 'red';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  tone?: Tone;
}

export function StatCard({ title, value, subtitle, icon: Icon, tone = 'orange' }: StatCardProps) {
  return (
    <CardBase>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tabular-nums text-zinc-950">{value}</h3>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
        <IconBadge icon={Icon} tone={tone === 'yellow' ? 'amber' : tone} size="lg" />
      </div>
    </CardBase>
  );
}
