type Tone = 'green' | 'yellow' | 'red' | 'orange' | 'dark' | 'default';

const toneClasses: Record<Tone, string> = {
  default: 'bg-zinc-100 text-zinc-700',
  green: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  dark: 'bg-zinc-800 text-white',
};

interface BadgeStatusProps {
  label: string;
  tone?: Tone;
}

export function BadgeStatus({ label, tone = 'default' }: BadgeStatusProps) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>{label}</span>;
}
