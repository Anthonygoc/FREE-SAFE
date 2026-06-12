'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, BadgeCheck, Building2, Fuel, Users } from 'lucide-react';

import { StatCard } from '@/components/dashboard/stat-card';
import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useDashboardKPIs } from '@/hooks/use-dashboard';
import { usePostos } from '@/hooks/use-postos';

const animation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

export default function DashboardPage() {
  const { data: kpis, isLoading: loadingKPIs } = useDashboardKPIs();
  const { data: postos, isLoading: loadingPostos } = usePostos();

  if (loadingKPIs || loadingPostos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size={30} />
      </div>
    );
  }

  const ranking = [...(postos ?? [])].sort((a, b) => b.conformidade - a.conformidade);

  return (
    <motion.div {...animation} className="min-w-0 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Dashboard Geral</h1>
        <p className="mt-1 text-zinc-500">Visão consolidada dos postos, treinamentos e conformidade.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Postos cadastrados" value={kpis?.totalPostos ?? 0} subtitle="Unidades ativas" icon={Building2} tone="orange" />
        <StatCard title="Colaboradores" value={kpis?.totalColaboradores ?? 0} subtitle="Ativos no sistema" icon={Users} tone="green" />
        <StatCard title="Conformidade média" value={`${kpis?.mediaConformidade ?? 0}%`} subtitle="Auditoria operacional" icon={BadgeCheck} tone="yellow" />
        <StatCard title="Pendências abertas" value={kpis?.totalPendencias ?? 0} subtitle="Itens para regularizar" icon={AlertTriangle} tone="red" />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <motion.div {...animation} className="min-w-0 xl:col-span-2">
          <CardBase>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-zinc-900">Ranking de conformidade</h2>
              <BadgeStatus label="Atualização diária" tone="orange" />
            </div>
            <div className="mt-5 space-y-5">
              {ranking.map((posto) => (
                <div key={posto.id} className="rounded-2xl border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-orange-50 p-2 text-orange-600">
                        <Fuel className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">{posto.nome}</p>
                        <p className="text-sm text-zinc-500">{posto.cidade}/{posto.uf}</p>
                        <p className="mt-2 text-xs text-zinc-500">Colaboradores: 0 • Pendências: 0</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-zinc-700">{posto.conformidade}%</p>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={posto.conformidade} />
                  </div>
                </div>
              ))}
            </div>
          </CardBase>
        </motion.div>

        <motion.div {...animation} className="min-w-0">
          <CardBase>
            <h2 className="text-lg font-bold text-zinc-900">Alertas críticos</h2>
            <div className="mt-5 space-y-3">
              {(kpis?.alertas ?? []).length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum alerta no momento.</p>
              ) : (
                (kpis?.alertas ?? []).map((alerta) => (
                  <div key={alerta.tipo} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-800">{alerta.tipo}</p>
                      <BadgeStatus label={alerta.nivel === 'critico' ? 'Crítico' : 'Atenção'} tone={alerta.nivel === 'critico' ? 'red' : 'yellow'} />
                    </div>
                    <p className="mt-2 text-sm text-zinc-600">{alerta.quantidade} ocorrência(s)</p>
                  </div>
                ))
              )}
            </div>
          </CardBase>
        </motion.div>
      </div>
    </motion.div>
  );
}
