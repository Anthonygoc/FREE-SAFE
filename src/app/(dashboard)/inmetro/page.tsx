'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Camera, CheckCircle2, ChevronDown, Download, FileSpreadsheet, FileText, Gauge, History, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { BadgeStatus, CardBase, IconBadge, InputBase, LoadingSpinner, SelectBase } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  useAfericoesByPosto,
  useCreateAfericaoLote,
  useDeleteAfericao,
  useDeleteLoteAfericao,
  type Afericao,
} from '@/hooks/use-afericao';
import { useBombasByPosto } from '@/hooks/use-bombas';
import { usePostos } from '@/hooks/use-postos';

const animation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

type BicoFormState = {
  resultadoMl: string;
  fotoUrl?: string;
  observacoes?: string;
};

type FormState = Record<string, BicoFormState>;

type HistoricoLote = {
  loteId: string;
  loteRealId?: string;
  afericoes: Afericao[];
  responsavelNome: string;
  criadoEm: string;
  totalBicos: number;
  foraTolerancia: number;
};

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => resolve(String(reader.result ?? ''));
  reader.onerror = () => reject(new Error('Falha ao carregar imagem'));
  reader.readAsDataURL(file);
});

function formatarNumero(value: number) {
  return value.toString().padStart(2, '0');
}

function formatarProduto(produto: string) {
  switch (produto) {
    case 'GASOLINA_COMUM':
      return 'Gasolina Comum';
    case 'GASOLINA_ADITIVADA':
      return 'Gasolina Aditivada';
    case 'GASOLINA_PREMIUM':
      return 'Gasolina Premium';
    case 'ETANOL_HIDRATADO':
      return 'Etanol';
    case 'DIESEL_S10':
      return 'Diesel S10';
    case 'DIESEL_S500':
      return 'Diesel S500';
    default:
      return produto;
  }
}

function formatarDataHora(value: string) {
  return dateTimeFormatter.format(new Date(value)).replace(',', ' às');
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function getResponsavelLabel(
  item: Afericao,
  sessionUser: { id?: string; name?: string | null } | undefined,
) {
  if (item.responsavelNome) {
    return item.responsavelNome;
  }

  if (sessionUser?.id === item.responsavelId && sessionUser.name) {
    return sessionUser.name;
  }

  return item.responsavelId;
}

function getResultadoNumero(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function getSituacaoResultado(value: string | undefined) {
  const resultado = getResultadoNumero(value);

  if (resultado === null) {
    return null;
  }

  return {
    resultado,
    dentro: resultado >= -100 && resultado <= 100,
  };
}

function getProdutoTextClass(produto: string) {
  if (produto.includes('ETANOL')) {
    return 'text-emerald-600';
  }

  if (produto.includes('GASOLINA')) {
    return 'text-amber-600';
  }

  return 'text-zinc-600';
}

export default function InmetroPage() {
  const { data: session } = useSession();
  const { data: postos, isLoading: loadingPostos } = usePostos();
  const { mutate: createAfericaoLote, isPending } = useCreateAfericaoLote();
  const { mutate: deleteAfericao, isPending: isDeletingAfericao } = useDeleteAfericao();
  const { mutate: deleteLoteAfericao, isPending: isDeletingLote } = useDeleteLoteAfericao();

  const [postoId, setPostoId] = useState('');
  const [formState, setFormState] = useState<FormState>({});
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null);
  const [filtroDataDe, setFiltroDataDe] = useState('');
  const [filtroDataAte, setFiltroDataAte] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState<'TODOS' | 'DENTRO' | 'FORA'>('TODOS');
  const [lotesAbertos, setLotesAbertos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!postoId && postos && postos.length > 0) {
      setPostoId(postos[0].id);
    }
  }, [postoId, postos]);

  const { data: bombas, isLoading: loadingBombas } = useBombasByPosto(postoId);
  const { data: historico, isLoading: loadingHistorico } = useAfericoesByPosto(postoId);

  const podeConfigurar = session?.user?.perfil === 'ADMIN' || session?.user?.perfil === 'GERENTE';

  function atualizarCampo(bicoId: string, changes: Partial<BicoFormState>) {
    setFormState((current) => ({
      ...current,
      [bicoId]: {
        resultadoMl: current[bicoId]?.resultadoMl ?? '',
        observacoes: current[bicoId]?.observacoes,
        fotoUrl: current[bicoId]?.fotoUrl,
        ...changes,
      },
    }));
  }

  async function handleSelecionarFoto(bicoId: string, file?: File) {
    if (!file) {
      return;
    }

    try {
      const fotoUrl = await toBase64(file);
      atualizarCampo(bicoId, { fotoUrl });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar foto.');
    }
  }

  function handleChangePosto(nextPostoId: string) {
    setPostoId(nextPostoId);
    setFormState({});
    setImagemAmpliada(null);
    setFiltroDataDe('');
    setFiltroDataAte('');
    setFiltroSituacao('TODOS');
    setLotesAbertos(new Set());
  }

  function limparFormulario() {
    setFormState({});
  }

  function handleRegistrarTodas() {
    if (!postoId || !bombas || bombas.length === 0) {
      return;
    }

    const afericoes = bombas.flatMap((bomba) => bomba.bicos.flatMap((bico) => {
      const entry = formState[bico.id];
      const resultadoMl = getResultadoNumero(entry?.resultadoMl);

      if (resultadoMl === null) {
        return [];
      }

      return [{
        bicoId: bico.id,
        produto: bico.produto,
        bomba: bomba.numero,
        bico: bico.numero,
        resultadoMl,
        observacoes: entry?.observacoes?.trim() || undefined,
        fotoUrl: entry?.fotoUrl,
      }];
    }));

    if (afericoes.length === 0) {
      toast.error('Preencha pelo menos um resultado para registrar.');
      return;
    }

    createAfericaoLote(
      {
        postoId,
        afericoes,
      },
      {
        onSuccess: (output) => {
          toast.success(`${output.registradas} aferições registradas`);
          limparFormulario();
        },
      },
    );
  }

  const totalPreenchidas = (bombas ?? []).reduce((count, bomba) => (
    count + bomba.bicos.filter((bico) => getResultadoNumero(formState[bico.id]?.resultadoMl) !== null).length
  ), 0);
  const totalBicos = (bombas ?? []).reduce((count, bomba) => count + bomba.bicos.length, 0);
  const totalDentroAtual = (bombas ?? []).reduce((count, bomba) => (
    count + bomba.bicos.filter((bico) => {
      const situacao = getSituacaoResultado(formState[bico.id]?.resultadoMl);
      return situacao?.dentro ?? false;
    }).length
  ), 0);
  const totalForaAtual = (bombas ?? []).reduce((count, bomba) => (
    count + bomba.bicos.filter((bico) => {
      const situacao = getSituacaoResultado(formState[bico.id]?.resultadoMl);
      return situacao ? !situacao.dentro : false;
    }).length
  ), 0);
  const bombasCompletas = (bombas ?? []).filter((bomba) => (
    bomba.bicos.length > 0 && bomba.bicos.every((bico) => getResultadoNumero(formState[bico.id]?.resultadoMl) !== null)
  )).length;
  const todosBicosPreenchidos = totalBicos > 0 && totalPreenchidas === totalBicos;

  const historicoAgrupado = (historico ?? []).reduce<Record<string, HistoricoLote>>((acc, item) => {
    const grupoId = item.loteId ?? item.id;
    const grupoAtual = acc[grupoId];
    const responsavelNome = getResponsavelLabel(item, session?.user);

    if (!grupoAtual) {
      acc[grupoId] = {
        loteId: grupoId,
        loteRealId: item.loteId,
        afericoes: [item],
        responsavelNome,
        criadoEm: item.criadoEm,
        totalBicos: 1,
        foraTolerancia: item.situacao === 'FORA_DA_TOLERANCIA' ? 1 : 0,
      };
      return acc;
    }

    grupoAtual.afericoes.push(item);
    grupoAtual.totalBicos += 1;
    grupoAtual.foraTolerancia += item.situacao === 'FORA_DA_TOLERANCIA' ? 1 : 0;

    if (new Date(item.criadoEm).getTime() > new Date(grupoAtual.criadoEm).getTime()) {
      grupoAtual.criadoEm = item.criadoEm;
    }

    return acc;
  }, {});

  const lotesFiltrados = Object.values(historicoAgrupado)
    .map((lote) => ({
      ...lote,
      afericoes: [...lote.afericoes].sort((a, b) => (
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      )),
    }))
    .filter((lote) => {
      const afericoesCompativeis = lote.afericoes.filter((item) => {
        const dataItem = new Date(item.criadoEm);
        const dentroDataDe = !filtroDataDe || dataItem >= new Date(`${filtroDataDe}T00:00:00`);
        const dentroDataAte = !filtroDataAte || dataItem <= new Date(`${filtroDataAte}T23:59:59`);
        const dentroSituacao = filtroSituacao === 'TODOS'
          || (filtroSituacao === 'DENTRO' && item.situacao === 'DENTRO_DA_LEGISLACAO')
          || (filtroSituacao === 'FORA' && item.situacao === 'FORA_DA_TOLERANCIA');

        return dentroDataDe && dentroDataAte && dentroSituacao;
      });

      return afericoesCompativeis.length > 0;
    })
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  const totalAfericoesFiltradas = lotesFiltrados.reduce((count, lote) => {
    return count + lote.afericoes.filter((item) => {
      const dataItem = new Date(item.criadoEm);
      const dentroDataDe = !filtroDataDe || dataItem >= new Date(`${filtroDataDe}T00:00:00`);
      const dentroDataAte = !filtroDataAte || dataItem <= new Date(`${filtroDataAte}T23:59:59`);
      const dentroSituacao = filtroSituacao === 'TODOS'
        || (filtroSituacao === 'DENTRO' && item.situacao === 'DENTRO_DA_LEGISLACAO')
        || (filtroSituacao === 'FORA' && item.situacao === 'FORA_DA_TOLERANCIA');

      return dentroDataDe && dentroDataAte && dentroSituacao;
    }).length;
  }, 0);

  function alternarLote(loteId: string) {
    setLotesAbertos((current) => {
      const next = new Set(current);

      if (next.has(loteId)) {
        next.delete(loteId);
      } else {
        next.add(loteId);
      }

      return next;
    });
  }

  function handleExcluirAfericao(afericaoId: string) {
    if (!postoId || !window.confirm('Excluir esta aferição?')) {
      return;
    }

    deleteAfericao({ afericaoId, postoId });
  }

  function handleExcluirLote(lote: HistoricoLote) {
    if (!postoId || !window.confirm('Excluir este lote de aferições?')) {
      return;
    }

    if (!lote.loteRealId) {
      deleteAfericao({ afericaoId: lote.afericoes[0].id, postoId });
      return;
    }

    deleteLoteAfericao({ loteId: lote.loteRealId, postoId });
  }

  function handleAbrirDocumento(loteId: string, formato: 'pdf' | 'xlsx') {
    window.open(`/api/afericao/lote/${loteId}/${formato}`, '_blank', 'noopener,noreferrer');
  }

  if (loadingPostos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size={30} />
      </div>
    );
  }

  return (
    <>
      <motion.div {...animation} className="space-y-6">
        <section className="rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          <div className="space-y-5 p-6 lg:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <IconBadge icon={Gauge} tone="orange" size="lg" />
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-950">INMETRO</h1>
                  <p className="text-sm text-zinc-500">Aferição de bombas e bicos</p>
                  <p className="max-w-3xl text-sm leading-6 text-zinc-600">
                    Registre as medições do lote atual, acompanhe a tolerância por bico e mantenha o histórico técnico pronto para auditoria.
                  </p>
                </div>
              </div>

              {podeConfigurar ? (
                <Link
                  href="/inmetro/configurar"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
                >
                  Configurar bombas
                </Link>
              ) : null}
            </div>

            <div className="grid gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">Posto</p>
                <SelectBase
                  value={postoId}
                  onChange={(event) => handleChangePosto(event.target.value)}
                >
                  <option value="">Selecione um posto</option>
                  {(postos ?? []).map((posto) => (
                    <option key={posto.id} value={posto.id}>
                      {posto.nome}
                    </option>
                  ))}
                </SelectBase>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">Data</p>
                <div className="rounded-xl border border-orange-100 bg-white px-3 py-2.5 text-sm text-zinc-700">
                  {formatarData(new Date().toISOString())}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">Responsável</p>
                <div className="rounded-xl border border-orange-100 bg-white px-3 py-2.5 text-sm text-zinc-700">
                  {session?.user?.name || 'Usuário autenticado'}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {!postoId ? (
              <CardBase>
                <p className="text-sm text-zinc-500">Selecione um posto para carregar as bombas e bicos.</p>
              </CardBase>
            ) : loadingBombas ? (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
                <LoadingSpinner size={32} />
              </div>
            ) : (bombas ?? []).length === 0 ? (
              <CardBase>
                <p className="text-sm text-zinc-500">Nenhuma bomba cadastrada para o posto selecionado.</p>
              </CardBase>
            ) : (
              <div className="space-y-5">
                {(bombas ?? []).map((bomba, bombaIndex) => {
                  const preenchidos = bomba.bicos.filter((bico) => (
                    getResultadoNumero(formState[bico.id]?.resultadoMl) !== null
                  )).length;
                  const completa = bomba.bicos.length > 0 && preenchidos === bomba.bicos.length;

                  return (
                    <motion.div
                      key={bomba.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: bombaIndex * 0.05, duration: 0.3 }}
                    >
                      <CardBase padding="md">
                        <div className="mb-4 rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <IconBadge icon={Gauge} tone="orange" size="md" />
                              <div>
                                <h2 className="text-base font-semibold text-zinc-950">
                                  {`Bomba ${formatarNumero(bomba.numero)}`}
                                </h2>
                                <p className="text-sm text-zinc-500">{`${bomba.bicos.length} bico(s) configurado(s)`}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-600">
                                {`${preenchidos}/${bomba.bicos.length} preenchidos`}
                              </span>
                              <BadgeStatus
                                label={completa ? 'Completa' : 'Em andamento'}
                                tone={completa ? 'green' : 'yellow'}
                                icon={completa ? CheckCircle2 : AlertTriangle}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>

                        {bomba.bicos.length === 0 ? (
                          <p className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                            Esta bomba ainda não possui bicos configurados.
                          </p>
                        ) : (
                          <div className="overflow-hidden rounded-2xl border border-zinc-200">
                            <div className="hidden grid-cols-[76px_minmax(160px,1.2fr)_120px_160px_88px_minmax(180px,1fr)] items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 md:grid">
                              <span>Bico</span>
                              <span>Produto</span>
                              <span>Resultado</span>
                              <span>Situação</span>
                              <span>Foto</span>
                              <span>Observação</span>
                            </div>

                            <div className="divide-y divide-zinc-100">
                              {bomba.bicos.map((bico) => {
                                const entry = formState[bico.id];
                                const situacao = getSituacaoResultado(entry?.resultadoMl);
                                const linhaStatusClass = situacao
                                  ? situacao.dentro
                                    ? 'bg-orange-50/50'
                                    : 'bg-red-50/50'
                                  : 'bg-white';

                                return (
                                  <div
                                    key={bico.id}
                                    className={cn(
                                      'px-4 py-4 transition-colors hover:bg-zinc-50 md:grid md:grid-cols-[76px_minmax(160px,1.2fr)_120px_160px_88px_minmax(180px,1fr)] md:items-center md:gap-3 md:py-3',
                                      linhaStatusClass,
                                    )}
                                  >
                                    <div className="grid gap-3 md:contents">
                                      <div className="flex items-center justify-between md:block">
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">Bico</span>
                                        <div className="flex items-center">
                                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-700">
                                            {formatarNumero(bico.numero)}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between gap-3 md:block">
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">Produto</span>
                                        <p className={cn('text-sm font-semibold', getProdutoTextClass(bico.produto))}>
                                          {formatarProduto(bico.produto)}
                                        </p>
                                      </div>

                                      <div className="flex items-center justify-between gap-3 md:block">
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">Resultado</span>
                                        <InputBase
                                          type="number"
                                          placeholder="-40"
                                          value={entry?.resultadoMl ?? ''}
                                          onChange={(event) => atualizarCampo(bico.id, { resultadoMl: event.target.value })}
                                          className="h-10 w-full md:w-28"
                                        />
                                      </div>

                                      <div className="flex items-center justify-between gap-3 md:block">
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">Situação</span>
                                        {situacao ? (
                                          <span
                                            className={cn(
                                              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
                                              situacao.dentro
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                : 'border-red-200 bg-red-50 text-red-700',
                                            )}
                                          >
                                            {situacao.dentro ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                                            {situacao.dentro ? 'Dentro' : 'Fora'}
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-500">
                                            Pendente
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center justify-between gap-3 md:block">
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">Foto</span>
                                        <div className="flex items-center md:justify-start">
                                          {entry?.fotoUrl ? (
                                            <button
                                              type="button"
                                              onClick={() => setImagemAmpliada(entry.fotoUrl ?? null)}
                                              className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
                                            >
                                              <Image
                                                src={entry.fotoUrl}
                                                alt={`Foto da aferição do bico ${bico.numero}`}
                                                width={40}
                                                height={40}
                                                unoptimized
                                                className="h-10 w-10 object-cover"
                                              />
                                            </button>
                                          ) : (
                                            <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 active:scale-[0.98]">
                                              <Camera className="h-4 w-4" />
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(event) => void handleSelecionarFoto(bico.id, event.target.files?.[0])}
                                              />
                                            </label>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between gap-3 md:block">
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">Observação</span>
                                        <InputBase
                                          type="text"
                                          value={entry?.observacoes ?? ''}
                                          onChange={(event) => atualizarCampo(bico.id, { observacoes: event.target.value })}
                                          placeholder="Observação opcional"
                                          className="h-10 w-full"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardBase>
                    </motion.div>
                  );
                })}

                <motion.div
                  {...animation}
                  className="sticky bottom-4 z-10 rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-lg backdrop-blur"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Registrar aferições</p>
                      <p className="mt-1 text-xs text-zinc-500">O envio só é liberado quando todos os bicos estiverem preenchidos.</p>
                      <p
                        className={cn(
                          'mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold',
                          todosBicosPreenchidos ? 'text-emerald-700' : 'text-amber-700',
                          todosBicosPreenchidos ? 'bg-emerald-50' : 'bg-amber-50',
                        )}
                      >
                        {`${totalPreenchidas} de ${totalBicos} bicos preenchidos`}
                      </p>
                    </div>

                    <div className="w-full md:w-auto">
                      {!todosBicosPreenchidos ? (
                        <p className="mb-2 text-sm font-medium text-amber-700 md:text-right">
                          Preencha todos os bicos para liberar o envio
                        </p>
                      ) : null}

                      <button
                        type="button"
                        onClick={handleRegistrarTodas}
                        disabled={isPending || !todosBicosPreenchidos}
                        className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:min-w-[280px]"
                      >
                        {isPending ? 'Registrando aferições...' : 'Registrar aferições'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <CardBase className="sticky top-24" padding="lg">
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <IconBadge icon={todosBicosPreenchidos ? CheckCircle2 : AlertTriangle} tone={todosBicosPreenchidos ? 'emerald' : 'amber'} size="md" />
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-zinc-950">Resumo</p>
                    <p className="text-sm text-zinc-500">
                      {todosBicosPreenchidos ? 'Lote pronto para registro.' : 'Ainda existem medições pendentes.'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Preenchidos</p>
                    <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-950">{`${totalPreenchidas}/${totalBicos}`}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Dentro</p>
                    <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-700">{totalDentroAtual}</p>
                  </div>
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-700">Fora</p>
                    <p className="mt-2 text-2xl font-bold tabular-nums text-red-700">{totalForaAtual}</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-zinc-600">Tolerância</span>
                    <span className="text-sm font-semibold text-zinc-950">-100 mL a +100 mL</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-zinc-600">Total de bicos</span>
                    <span className="text-sm font-semibold tabular-nums text-zinc-950">{totalBicos}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-zinc-600">Bombas completas</span>
                    <span className="text-sm font-semibold tabular-nums text-zinc-950">{`${bombasCompletas}/${(bombas ?? []).length}`}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                  <p className="text-sm font-semibold text-zinc-900">Status do lote</p>
                  <div className="mt-3">
                    <BadgeStatus
                      label={todosBicosPreenchidos ? 'Pronto para envio' : 'Em preenchimento'}
                      tone={todosBicosPreenchidos ? 'green' : 'yellow'}
                      icon={todosBicosPreenchidos ? CheckCircle2 : AlertTriangle}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    {todosBicosPreenchidos
                      ? 'Todos os resultados foram informados. O registro do lote pode ser realizado.'
                      : 'Continue preenchendo os bicos pendentes antes de confirmar o envio.'}
                  </p>
                </div>
              </div>
            </CardBase>
          </aside>
        </div>

        <section className="rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <IconBadge icon={History} tone="zinc" size="md" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Arquivo técnico</p>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-950">Histórico de aferições</h2>
                  <p className="text-sm text-zinc-500">Acompanhe os registros recentes do posto selecionado.</p>
                </div>
              </div>
              {loadingHistorico ? <LoadingSpinner size={20} /> : null}
            </div>
          </div>

          <div className="space-y-5 px-6 py-6">
            {!postoId ? (
              <p className="text-sm text-zinc-500">Selecione um posto para visualizar o histórico.</p>
            ) : loadingHistorico ? (
              <div className="flex h-32 items-center justify-center">
                <LoadingSpinner size={28} />
              </div>
            ) : (historico ?? []).length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma aferição registrada para o posto selecionado.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-[1fr_1fr_220px_auto] md:items-end">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">De</label>
                    <InputBase
                      type="date"
                      value={filtroDataDe}
                      onChange={(event) => setFiltroDataDe(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Até</label>
                    <InputBase
                      type="date"
                      value={filtroDataAte}
                      onChange={(event) => setFiltroDataAte(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Situação</label>
                    <SelectBase
                      value={filtroSituacao}
                      onChange={(event) => setFiltroSituacao(event.target.value as 'TODOS' | 'DENTRO' | 'FORA')}
                    >
                      <option value="TODOS">Todos</option>
                      <option value="DENTRO">Dentro</option>
                      <option value="FORA">Fora</option>
                    </SelectBase>
                  </div>
                  <div className="text-sm font-medium text-zinc-500">
                    {`${totalAfericoesFiltradas} aferições em ${lotesFiltrados.length} lotes`}
                  </div>
                </div>

                {lotesFiltrados.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nenhum lote encontrado com os filtros selecionados.</p>
                ) : (
                  lotesFiltrados.map((lote, index) => {
                    const aberto = lotesAbertos.has(lote.loteId);
                    const loteLegado = !lote.loteRealId;

                    return (
                      <motion.div
                        key={lote.loteId}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.25 }}
                        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
                      >
                        <div
                          className={cn(
                            'flex flex-col gap-4 p-4 transition-all md:flex-row md:items-center md:justify-between',
                            aberto ? 'bg-white' : 'bg-zinc-50',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => alternarLote(lote.loteId)}
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                          >
                            <ChevronDown
                              className={`mt-0.5 h-5 w-5 shrink-0 text-orange-500 transition-transform ${aberto ? 'rotate-180' : ''}`}
                            />
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-zinc-900">
                                  {`Aferição de ${formatarDataHora(lote.criadoEm)}`}
                                </p>
                                {loteLegado ? (
                                  <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                                    Legado
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm text-zinc-500">{`Responsável: ${lote.responsavelNome}`}</p>
                            </div>
                          </button>

                          <div className="flex flex-col gap-3 md:items-end">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                                {`${lote.totalBicos} bicos`}
                              </span>
                              {lote.foraTolerancia > 0 ? (
                                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                  {`${lote.foraTolerancia} fora`}
                                </span>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={loteLegado}
                                onClick={() => {
                                  if (!lote.loteRealId) {
                                    return;
                                  }
                                  handleAbrirDocumento(lote.loteRealId, 'pdf');
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <FileText className="h-4 w-4" />
                                <Download className="h-4 w-4" />
                                PDF
                              </button>
                              <button
                                type="button"
                                disabled={loteLegado}
                                onClick={() => {
                                  if (!lote.loteRealId) {
                                    return;
                                  }
                                  handleAbrirDocumento(lote.loteRealId, 'xlsx');
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <FileSpreadsheet className="h-4 w-4" />
                                <Download className="h-4 w-4" />
                                Excel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExcluirLote(lote)}
                                disabled={isDeletingLote || isDeletingAfericao}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir lote
                              </button>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence initial={false}>
                          {aberto ? (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: 'easeInOut' }}
                              className="overflow-hidden border-t border-zinc-100"
                            >
                              <div className="space-y-3 p-4">
                                {lote.afericoes.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-4 md:flex-row md:items-center md:justify-between"
                                  >
                                    <div className="space-y-2">
                                      <p className="text-sm font-semibold text-zinc-900">
                                        {`Bomba ${formatarNumero(item.bomba)} → Bico ${formatarNumero(item.bico)} — ${formatarProduto(item.produto)}`}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm text-zinc-600">{`Resultado ${item.resultadoMl} mL`}</p>
                                        <BadgeStatus
                                          label={item.situacao === 'DENTRO_DA_LEGISLACAO' ? 'DENTRO' : 'FORA'}
                                          tone={item.situacao === 'DENTRO_DA_LEGISLACAO' ? 'green' : 'red'}
                                          icon={item.situacao === 'DENTRO_DA_LEGISLACAO' ? CheckCircle2 : AlertTriangle}
                                        />
                                      </div>
                                      <p className="text-xs text-zinc-400">{formatarData(item.criadoEm)}</p>
                                    </div>

                                    <div className="flex items-center gap-3 self-start md:self-center">
                                      {item.fotoUrl ? (
                                        <button
                                          type="button"
                                          onClick={() => setImagemAmpliada(item.fotoUrl ?? null)}
                                          className="overflow-hidden rounded-xl border border-zinc-200"
                                        >
                                          <Image
                                            src={item.fotoUrl}
                                            alt={`Foto da aferição ${item.id}`}
                                            width={48}
                                            height={48}
                                            unoptimized
                                            className="h-12 w-12 object-cover"
                                          />
                                        </button>
                                      ) : null}
                                      <button
                                        type="button"
                                        onClick={() => handleExcluirAfericao(item.id)}
                                        disabled={isDeletingAfericao || isDeletingLote}
                                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Excluir
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </section>
      </motion.div>

      <AnimatePresence>
        {imagemAmpliada ? (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setImagemAmpliada(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="max-h-[85vh] max-w-[85vw]"
            >
              <Image
                src={imagemAmpliada}
                alt="Foto ampliada da aferição"
                width={1200}
                height={1200}
                unoptimized
                className="max-h-[85vh] max-w-[85vw] rounded-2xl border border-white/20 bg-white object-contain shadow-2xl"
              />
            </motion.div>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </>
  );
}
