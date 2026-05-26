import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-400">
      <Icon className="h-12 w-12" />
      <p className="text-lg font-semibold text-zinc-600">{title}</p>
      <p className="text-sm text-center max-w-xs">{description}</p>
      {action}
    </div>
  );
}
