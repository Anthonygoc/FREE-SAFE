'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { RouteGuard } from '@/components/auth/route-guard';
import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProgressBar } from '@/components/ui/progress-bar';
import { podeAcessar } from '@/domain/permissions/permissions';
import { usePostos } from '@/hooks/use-postos';

const animation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function getRisco(conformidade: number): { label: string; tone: 'green' | 'yellow' | 'red' } {
  if (conformidade >= 90) return { label: 'Baixo', tone: 'green' };
  if (conformidade >= 80) return { label: 'Médio', tone: 'yellow' };
  return { label: 'Alto', tone: 'red' };
}

export default function PostosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { data: postos, isLoading } = usePostos();
  const [termoBusca, setTermoBusca] = useState('');
  const podeAbrirDetalhe = podeAcessar(
    (session?.user?.perfil ?? 'COLABORADOR') as Parameters<typeof podeAcessar>[0],
    'postos',
    'ver',
  );

  const postosFiltrados = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    if (!termo) return postos ?? [];

    return (postos ?? []).filter((posto) => posto.nome.toLowerCase().includes(termo));
  }, [postos, termoBusca]);

  if (isLoading) {
    return (
      <RouteGuard recurso="postos">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size={30} />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard recurso="postos">
      <motion.div {...animation} className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Postos</h1>
        <p className="mt-1 text-zinc-500">Conformidade e status operacional.</p>
      </div>

      <motion.div {...animation} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 md:w-[420px]">
          <Search className="h-5 w-5 text-zinc-500" />
          <input
            value={termoBusca}
            onChange={(event) => setTermoBusca(event.target.value)}
            placeholder="Buscar por nome do posto..."
            className="w-full bg-transparent text-sm text-zinc-700 placeholder:text-zinc-500 outline-none transition-colors"
          />
      </motion.div>

      <motion.div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={staggerContainer}
      >
        {postosFiltrados.map((posto) => {
          const risco = getRisco(posto.conformidade);

          return (
            <motion.div
              key={posto.id}
              variants={staggerItem}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <CardBase className="transition-all hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-zinc-900">{posto.nome}</p>
                    <p className="mt-1 text-sm text-zinc-500">{posto.cidade}/{posto.uf}</p>
                  </div>
                  <BadgeStatus label={risco.label} tone={risco.tone} />
                </div>

                <div className="mt-5 space-y-1 text-sm text-zinc-600">
                  <p>Gerente: A definir</p>
                  <p>Colaboradores: 0</p>
                  <p>Pendências: 0</p>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <p className="font-medium text-zinc-600">Conformidade</p>
                    <p className="font-bold tabular-nums text-zinc-800">{posto.conformidade}%</p>
                  </div>
                  <ProgressBar value={posto.conformidade} />
                </div>

                {podeAbrirDetalhe ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/postos/${posto.id}`)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition-all hover:bg-zinc-50 active:scale-[0.98]"
                  >
                    Abrir
                    <ChevronRight className="h-4 w-4 text-orange-500" />
                  </button>
                ) : null}
              </CardBase>
            </motion.div>
          );
        })}
      </motion.div>
      </motion.div>
    </RouteGuard>
  );
}
