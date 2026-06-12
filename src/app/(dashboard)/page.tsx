'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, BadgeCheck, Building2, Fuel, Users } from 'lucide-react';

import { StatCard } from '@/components/dashboard/stat-card';
import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { IconBadge } from '@/components/ui/icon-badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useDashboardKPIs } from '@/hooks/use-dashboard';
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
  const alertas = kpis?.alertas ?? [];
  const alertasCriticos = alertas.filter((alerta) => alerta.nivel === 'critico').reduce((acc, alerta) => acc + alerta.quantidade, 0);
  const alertasAtencao = alertas.filter((alerta) => alerta.nivel !== 'critico').reduce((acc, alerta) => acc + alerta.quantidade, 0);
  const totalAlertas = alertasCriticos + alertasAtencao;

  return (
    <motion.div {...animation} className="min-w-0 space-y-6">
      <section className="rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="space-y-5 p-6 lg:p-7">
          <div className="flex items-start gap-4">
            <IconBadge icon={BadgeCheck} tone="orange" size="lg" />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Dashboard Geral</h1>
              <p className="text-sm text-zinc-500">Visão consolidada dos postos, treinamentos e conformidade.</p>
              <p className="max-w-3xl text-sm leading-6 text-zinc-600">
                Acompanhe os indicadores operacionais, o ranking de conformidade e os alertas que exigem ação da equipe.
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-orange-100 bg-orange-50/45 p-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">Base ativa</p>
              <p className="text-sm font-semibold tabular-nums text-zinc-950">{kpis?.totalPostos ?? 0} unidades monitoradas</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">Atualização</p>
              <p className="text-sm font-semibold text-zinc-950">Leitura diária consolidada</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">Itens em atenção</p>
              <p className="text-sm font-semibold tabular-nums text-zinc-950">{totalAlertas} ocorrência(s) ativa(s)</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">Prioridade atual</p>
              <p className="text-sm font-semibold text-zinc-950">
                {alertasCriticos > 0 ? `${alertasCriticos} alerta(s) crítico(s)` : 'Sem críticos no momento'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <motion.div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={staggerContainer}
      >
        <motion.div variants={staggerItem}>
          <StatCard title="Postos cadastrados" value={kpis?.totalPostos ?? 0} subtitle="Unidades ativas" icon={Building2} tone="orange" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard title="Colaboradores" value={kpis?.totalColaboradores ?? 0} subtitle="Ativos no sistema" icon={Users} tone="green" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard title="Conformidade média" value={`${kpis?.mediaConformidade ?? 0}%`} subtitle="Auditoria operacional" icon={BadgeCheck} tone="yellow" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard title="Pendências abertas" value={kpis?.totalPendencias ?? 0} subtitle="Itens para regularizar" icon={AlertTriangle} tone="red" />
        </motion.div>
      </motion.div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <motion.div {...animation} className="min-w-0 xl:col-span-2">
          <CardBase padding="lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <IconBadge icon={Fuel} tone="orange" size="md" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Conformidade operacional</p>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-950">Ranking de conformidade</h2>
                </div>
              </div>
              <BadgeStatus label="Atualização diária" tone="orange" />
            </div>
            <motion.div
              className="mt-5 space-y-5"
              initial="hidden"
              animate="show"
              variants={staggerContainer}
            >
              {ranking.map((posto) => (
                <motion.div
                  key={posto.id}
                  variants={staggerItem}
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 300, duration: 0.3 }}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-sm font-bold tabular-nums text-zinc-700">
                      {String(ranking.indexOf(posto) + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <IconBadge icon={Fuel} tone="orange" size="sm" />
                            <p className="truncate font-semibold text-zinc-900">{posto.nome}</p>
                          </div>
                          <p className="mt-1 text-sm text-zinc-500">{posto.cidade}/{posto.uf}</p>
                        </div>
                        <p className="text-base font-bold tabular-nums text-zinc-700">{posto.conformidade}%</p>
                      </div>

                      <div className="space-y-2">
                        <ProgressBar value={posto.conformidade} tone={posto.conformidade >= 80 ? 'emerald' : posto.conformidade >= 60 ? 'amber' : 'red'} />
                        <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
                          <span>{`Posição ${ranking.indexOf(posto) + 1} no ranking geral`}</span>
                          <span className="tabular-nums">{posto.conformidade}% de conformidade</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </CardBase>
        </motion.div>

        <motion.div {...animation} className="min-w-0">
          <CardBase padding="lg">
            <div className="flex items-center gap-3">
              <IconBadge icon={AlertTriangle} tone="amber" size="md" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Monitoramento</p>
                <h2 className="text-xl font-bold tracking-tight text-zinc-950">Alertas críticos</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {(kpis?.alertas ?? []).length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum alerta no momento.</p>
              ) : (
                (kpis?.alertas ?? []).map((alerta) => {
                  const nivelLabel = alerta.nivel === 'critico' ? 'Crítico' : 'Atenção';
                  const tone = alerta.nivel === 'critico' ? 'red' : 'yellow';

                  return (
                    <div key={alerta.tipo} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{alerta.tipo}</p>
                          <p className="mt-2 text-sm tabular-nums text-zinc-600">{alerta.quantidade} ocorrência(s)</p>
                        </div>
                        <BadgeStatus label={nivelLabel} tone={tone} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardBase>
        </motion.div>
      </div>
    </motion.div>
  );
}
