import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <div className="rounded-full bg-zinc-50 p-4">
        <Icon className="h-10 w-10 text-zinc-400" />
      </div>
      <p className="text-lg font-semibold text-zinc-700">{title}</p>
      <p className="max-w-xs text-center text-sm text-zinc-500">{description}</p>
      {action}
    </div>
  );
}
