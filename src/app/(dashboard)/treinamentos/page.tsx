'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap } from 'lucide-react';

import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useCursos, type Curso } from '@/hooks/use-cursos';

const statusLabelMap: Record<string, string> = {
  CONCLUIDO: 'Concluido',
  EM_ANDAMENTO: 'Em andamento',
  PENDENTE: 'Nao iniciado',
};

const statusToneMap: Record<string, 'green' | 'yellow' | 'default'> = {
  CONCLUIDO: 'green',
  EM_ANDAMENTO: 'yellow',
  PENDENTE: 'default',
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

function getStatus(curso: Curso) {
  return curso.treinamento?.status ?? curso.status ?? 'PENDENTE';
}

export default function TreinamentosPage() {
  const { data: cursos, isLoading } = useCursos();

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <LoadingSpinner size={30} />
      </div>
    );
  }

  if (!cursos?.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Cursos e Treinamentos</h1>
          <p className="mt-1 text-zinc-500">Acompanhe os cursos obrigatórios e o progresso da equipe.</p>
        </div>
        <CardBase>
          <EmptyState
            icon={GraduationCap}
            title="Nenhum curso disponível"
            description="Os cursos ativos aparecerão aqui assim que forem publicados."
          />
        </CardBase>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Cursos e Treinamentos</h1>
        <p className="mt-1 text-zinc-500">Acesse os conteúdos, acompanhe o progresso e realize as provas.</p>
      </motion.div>

      <motion.div
        className="grid gap-4 lg:grid-cols-2"
        initial="hidden"
        animate="show"
        variants={staggerContainer}
      >
        {cursos.map((curso) => {
          const status = getStatus(curso);

          return (
            <motion.div
              key={curso.id}
              variants={staggerItem}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <CardBase className="flex h-full flex-col justify-between gap-5 transition-all hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                      <GraduationCap className="h-4 w-4" />
                      FREE SAFE
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-zinc-950">{curso.nome}</h2>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">
                        {curso.descricao ?? 'Curso sem descrição cadastrada.'}
                      </p>
                    </div>
                  </div>
                  <BadgeStatus
                    label={`${curso.cargaHoraria ?? 0}h`}
                    tone="dark"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <BadgeStatus label={`${curso.totalConteudos} conteúdos`} tone="orange" />
                  <BadgeStatus label={`${curso.totalQuestoes} questões`} tone="default" />
                  <BadgeStatus label={statusLabelMap[status]} tone={statusToneMap[status]} />
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Obrigatoriedade</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900">
                      {curso.obrigatorio ? 'Curso obrigatório na trilha' : 'Curso complementar'}
                    </p>
                  </div>
                  <Link
                    href={`/treinamentos/${curso.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98]"
                  >
                    Acessar curso
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardBase>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
