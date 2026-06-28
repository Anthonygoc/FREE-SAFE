'use client';

import type { LucideIcon } from 'lucide-react';

import { CardBase } from '@/components/ui/card-base';

interface ModulePlaceholderProps {
  tituloModulo: string;
  descricao?: string;
  icon: LucideIcon;
}

export function ModulePlaceholder({
  tituloModulo,
  descricao = 'Esta funcionalidade estará disponível em breve.',
  icon: Icon,
}: ModulePlaceholderProps) {
  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
      <CardBase className="mx-auto w-full max-w-2xl text-center" padding="lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          <Icon className="h-8 w-8" />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">{tituloModulo}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950">Módulo em desenvolvimento</h1>
        <p className="mt-3 text-base text-zinc-500">{descricao}</p>
      </CardBase>
    </div>
  );
}
