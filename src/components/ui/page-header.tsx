'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type PageHeaderProps = {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
};

export function PageHeader({ titulo, subtitulo, acao }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex items-start justify-between gap-4"
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">{titulo}</h1>
        {subtitulo ? <p className="mt-1 text-sm text-zinc-500">{subtitulo}</p> : null}
      </div>

      {acao ? <div className="shrink-0">{acao}</div> : null}
    </motion.div>
  );
}
