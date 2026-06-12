'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { IconBadge } from './icon-badge';

type PageHeaderProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  titulo?: string;
  subtitulo?: string;
  acao?: ReactNode;
};

export function PageHeader({ title, subtitle, action, icon, titulo, subtitulo, acao }: PageHeaderProps) {
  const resolvedTitle = title ?? titulo;
  const resolvedSubtitle = subtitle ?? subtitulo;
  const resolvedAction = action ?? acao;

  if (!resolvedTitle) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          {icon ? <IconBadge icon={icon} tone="orange" size="md" /> : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">{resolvedTitle}</h1>
            {resolvedSubtitle ? <p className="mt-1 text-sm text-zinc-500">{resolvedSubtitle}</p> : null}
          </div>
        </div>
      </div>

      {resolvedAction ? <div className="shrink-0 sm:self-start">{resolvedAction}</div> : null}
    </motion.div>
  );
}
