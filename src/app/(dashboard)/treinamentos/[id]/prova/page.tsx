'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Award, CheckCircle2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useColaboradores } from '@/hooks/use-colaboradores';
import { usePostos } from '@/hooks/use-postos';
import { useCursoQuestoes, useResultadoProva, useSubmitProva, type SubmitProvaOutput } from '@/hooks/use-cursos';

const alternativas = ['A', 'B', 'C', 'D'] as const;
const alternativaClasses = {
  idle: 'border-zinc-200 bg-white text-zinc-700 hover:border-orange-200 hover:bg-orange-50/50',
  selected: 'border-orange-300 bg-orange-50 text-orange-700 shadow-sm',
};

export default function ProvaCursoPage() {
  const params = useParams<{ id: string }>();
  const cursoId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: session, status: sessionStatus } = useSession();
  const { data: questoes, isLoading: loadingQuestoes } = useCursoQuestoes(cursoId);
  const { data: postos } = usePostos();
  const submitProva = useSubmitProva();
  const isAdminFlow = session?.user?.perfil === 'ADMIN' || session?.user?.perfil === 'GERENTE';
  const isAdmin = session?.user?.perfil === 'ADMIN';
  const isGerente = session?.user?.perfil === 'GERENTE';
  const postoGerenteId = session?.user?.postoId ?? '';
  const [postoSelecionado, setPostoSelecionado] = useState('');
  const { data: colaboradores, isLoading: loadingColaboradores } = useColaboradores(
    isAdmin ? postoSelecionado : isGerente ? postoGerenteId : undefined,
  );
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState('');
  const [respostas, setRespostas] = useState<Record<string, (typeof alternativas)[number]>>({});
  const [resultado, setResultado] = useState<SubmitProvaOutput | null>(null);
  const cursoResultadoId = isAdminFlow && !colaboradorSelecionado ? undefined : cursoId;
  const { data: resultadoAnterior } = useResultadoProva(
    cursoResultadoId,
    isAdminFlow ? colaboradorSelecionado || undefined : undefined,
  );

  const questoesOrdenadas = useMemo(
    () => [...(questoes ?? [])].sort((a, b) => a.ordem - b.ordem),
    [questoes],
  );

  useEffect(() => {
    if (!isAdmin || postoSelecionado || !postos?.length) {
      return;
    }

    setPostoSelecionado(postos[0].id);
  }, [isAdmin, postoSelecionado, postos]);

  useEffect(() => {
    if (!isGerente || postoSelecionado === postoGerenteId || !postoGerenteId) {
      return;
    }

    setPostoSelecionado(postoGerenteId);
  }, [isGerente, postoGerenteId, postoSelecionado]);

  useEffect(() => {
    if (!isAdminFlow) {
      return;
    }

    if (!colaboradorSelecionado && colaboradores?.length) {
      setColaboradorSelecionado(colaboradores[0].id);
    }
  }, [colaboradorSelecionado, colaboradores, isAdminFlow]);

  const questao = questoesOrdenadas[questaoAtual];
  const totalQuestoes = questoesOrdenadas.length;
  const todasRespondidas =
    totalQuestoes > 0 && questoesOrdenadas.every((item) => respostas[item.id] !== undefined);
  const podeEnviar = todasRespondidas && (!isAdminFlow || !!colaboradorSelecionado);

  function selecionarResposta(questaoId: string, resposta: (typeof alternativas)[number]) {
    setRespostas((atual) => ({ ...atual, [questaoId]: resposta }));
  }

  function handleSubmit() {
    if (!cursoId) {
      return;
    }

    if (!podeEnviar) {
      toast.error('Responda todas as questões antes de enviar a prova.');
      return;
    }

    submitProva.mutate(
      {
        cursoId,
        colaboradorId: isAdminFlow ? colaboradorSelecionado : undefined,
        respostas: questoesOrdenadas.map((item) => ({
          questaoId: item.id,
          resposta: respostas[item.id],
        })),
      },
      {
        onSuccess: (output) => {
          setResultado(output);
        },
      },
    );
  }

  function resetarProva() {
    setQuestaoAtual(0);
    setRespostas({});
    setResultado(null);
  }

  function baixarCertificado() {
    if (!resultado?.attemptId) {
      return;
    }

    window.open(`/api/certificados/${resultado.attemptId}`, '_blank', 'noopener,noreferrer');
  }

  if (sessionStatus === 'loading' || loadingQuestoes || (isAdminFlow && loadingColaboradores)) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <LoadingSpinner size={30} />
      </div>
    );
  }

  if (!cursoId || !questao) {
    return (
      <div className="space-y-6">
        <Link href={cursoId ? `/treinamentos/${cursoId}` : '/treinamentos'} className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <CardBase>
          <p className="text-sm text-zinc-500">A prova deste curso ainda não está disponível.</p>
        </CardBase>
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="space-y-6">
        <Link href={`/treinamentos/${cursoId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao curso
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <CardBase className="space-y-6 p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
              <Award className="h-4 w-4" />
              Resultado da prova
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm text-zinc-500">Nota final</p>
                <h1 className="mt-2 text-5xl font-black tracking-tight text-zinc-950">{resultado.nota}%</h1>
              </div>
              <BadgeStatus
                label={resultado.aprovado ? 'Aprovado' : 'Reprovado'}
                tone={resultado.aprovado ? 'green' : 'red'}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Acertos</p>
                <p className="mt-2 text-2xl font-bold text-zinc-950">
                  {resultado.acertos} de {resultado.total}
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Tentativa registrada</p>
                <p className="mt-2 text-sm font-semibold text-zinc-950">{resultado.attemptId}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {resultado.aprovado ? (
                <button
                  type="button"
                  onClick={baixarCertificado}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Baixar certificado
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetarProva}
                  className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Refazer prova
                </button>
              )}

              <Link
                href={`/treinamentos/${cursoId}`}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Voltar ao conteúdo
              </Link>
            </div>
          </CardBase>
        </motion.div>
      </div>
    );
  }

  const progresso = ((questaoAtual + 1) / totalQuestoes) * 100;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <Link href={`/treinamentos/${cursoId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao curso
        </Link>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-600">
              <GraduationCap className="h-4 w-4" />
              FREE SAFE
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Prova do curso</h1>
            <p className="mt-1 text-zinc-500">Responda todas as questões para enviar a tentativa.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {resultadoAnterior ? (
              <BadgeStatus
                label={`${resultadoAnterior.tentativas} tentativa(s) · melhor nota ${resultadoAnterior.melhorNota}%`}
                tone={resultadoAnterior.aprovado ? 'green' : 'yellow'}
              />
            ) : null}
            <BadgeStatus label={`${questaoAtual + 1} de ${totalQuestoes}`} tone="dark" />
          </div>
        </div>
      </motion.div>

      <CardBase className="space-y-6">
        {isAdminFlow ? (
          <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 lg:grid-cols-2">
            {isAdmin ? (
              <div className="space-y-2">
                <label htmlFor="postoId" className="text-sm font-semibold text-zinc-800">
                  Posto
                </label>
                <select
                  id="postoId"
                  value={postoSelecionado}
                  onChange={(event) => {
                    setPostoSelecionado(event.target.value);
                    setColaboradorSelecionado('');
                  }}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 outline-none transition focus:border-orange-500"
                >
                  <option value="">Selecione um posto</option>
                  {postos?.map((posto) => (
                    <option key={posto.id} value={posto.id}>
                      {posto.nome}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="postoNome" className="text-sm font-semibold text-zinc-800">
                  Posto
                </label>
                <input
                  id="postoNome"
                  value={postos?.find((posto) => posto.id === postoGerenteId)?.nome ?? 'Posto vinculado'}
                  readOnly
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 outline-none"
                />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="colaboradorId" className="text-sm font-semibold text-zinc-800">
                Colaborador para realizar a prova
              </label>
              <select
                id="colaboradorId"
                value={colaboradorSelecionado}
                onChange={(event) => setColaboradorSelecionado(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 outline-none transition focus:border-orange-500"
                disabled={!colaboradores?.length}
              >
                <option value="">
                  {colaboradores?.length ? 'Selecione um colaborador' : 'Nenhum colaborador neste posto'}
                </option>
                {colaboradores?.map((colaborador) => (
                  <option key={colaborador.id} value={colaborador.id}>
                    {colaborador.nome} · {colaborador.cargo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium text-zinc-500">
            <span>Progresso da prova</span>
            <span>{Math.round(progresso)}%</span>
          </div>
          <ProgressBar value={progresso} />
        </div>

        <motion.div
          key={questao.id}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Questão {questaoAtual + 1}
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-zinc-950">
              {questao.enunciado}
            </h2>
          </div>

          <div className="grid gap-3">
            {alternativas.map((alternativa) => {
              const selected = respostas[questao.id] === alternativa;
              const stateClass = selected ? alternativaClasses.selected : alternativaClasses.idle;

              return (
                <button
                  key={alternativa}
                  type="button"
                  onClick={() => selecionarResposta(questao.id, alternativa)}
                  className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition ${stateClass}`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-zinc-900">
                    {alternativa}
                  </span>
                  <span className="text-sm leading-6">{questao.alternativas[alternativa]}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <div className="flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setQuestaoAtual((current) => Math.max(0, current - 1))}
              disabled={questaoAtual === 0 || submitProva.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </button>

            {questaoAtual < totalQuestoes - 1 ? (
              <button
                type="button"
                onClick={() => setQuestaoAtual((current) => Math.min(totalQuestoes - 1, current + 1))}
                disabled={submitProva.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próxima
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {questaoAtual === totalQuestoes - 1 ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!podeEnviar || submitProva.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitProva.isPending ? <LoadingSpinner size={16} /> : null}
              Enviar prova
            </button>
          ) : null}
        </div>
      </CardBase>
    </div>
  );
}
