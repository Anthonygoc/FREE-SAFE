'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  useAfericoesByPosto,
  useCreateAfericaoLote,
  type Afericao,
} from '@/hooks/use-afericao';
import { useBombasByPosto } from '@/hooks/use-bombas';
import { usePostos } from '@/hooks/use-postos';

const animation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

const inputClassName =
  'w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-orange-500';

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

export default function InmetroPage() {
  const { data: session } = useSession();
  const { data: postos, isLoading: loadingPostos } = usePostos();
  const { mutate: createAfericaoLote, isPending } = useCreateAfericaoLote();

  const [postoId, setPostoId] = useState('');
  const [formState, setFormState] = useState<FormState>({});
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null);

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
  const todosBicosPreenchidos = totalBicos > 0 && totalPreenchidas === totalBicos;

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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">INMETRO — Aferição de Bombas</h1>
            <p className="mt-1 text-zinc-500">Preencha todas as medições do posto em uma única tela e registre em lote.</p>
          </div>

          {podeConfigurar ? (
            <Link
              href="/inmetro/configurar"
              className="inline-flex items-center justify-center rounded-xl border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
            >
              Configurar bombas
            </Link>
          ) : null}
        </div>

        <CardBase>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="w-full max-w-xl">
              <label className="mb-1 block text-sm font-medium text-zinc-700">Posto</label>
              <select
                value={postoId}
                onChange={(event) => handleChangePosto(event.target.value)}
                className={inputClassName}
              >
                <option value="">Selecione um posto</option>
                {(postos ?? []).map((posto) => (
                  <option key={posto.id} value={posto.id}>
                    {posto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 text-sm text-zinc-500">
              {loadingBombas ? <LoadingSpinner size={20} /> : null}
              {postoId && !loadingBombas ? <span>{`${totalPreenchidas} de ${totalBicos} bicos preenchidos`}</span> : null}
            </div>
          </div>
        </CardBase>

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
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className={`text-lg font-bold ${completa ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {`Bomba ${formatarNumero(bomba.numero)} — ${preenchidos}/${bomba.bicos.length} bicos preenchidos`}
                      </h2>
                      <p className="text-sm text-zinc-500">{`${bomba.bicos.length} bico(s) configurado(s)`}</p>
                    </div>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                      Registro em lote
                    </span>
                  </div>

                  <div>
                    {bomba.bicos.length === 0 ? (
                      <p className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                        Esta bomba ainda não possui bicos configurados.
                      </p>
                    ) : (
                      bomba.bicos.map((bico) => {
                        const entry = formState[bico.id];
                        const situacao = getSituacaoResultado(entry?.resultadoMl);

                        return (
                          <div
                            key={bico.id}
                            className="grid gap-4 border-b border-zinc-100 py-4 last:border-b-0 md:grid-cols-[minmax(220px,1.2fr)_minmax(180px,1fr)_auto_minmax(220px,1fr)_minmax(220px,1fr)] md:items-center"
                          >
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">
                                {`Bico ${formatarNumero(bico.numero)} — ${formatarProduto(bico.produto)}`}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-zinc-400">Aferição individual</p>
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                                Resultado em mL
                              </label>
                              <input
                                type="number"
                                placeholder="Ex.: -40"
                                value={entry?.resultadoMl ?? ''}
                                onChange={(event) => atualizarCampo(bico.id, { resultadoMl: event.target.value })}
                                className={inputClassName}
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              {situacao ? (
                                <BadgeStatus
                                  label={situacao.dentro ? 'DENTRO' : 'FORA'}
                                  tone={situacao.dentro ? 'green' : 'red'}
                                />
                              ) : (
                                <span className="text-xs text-zinc-400">Sem medição</span>
                              )}
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                                Foto
                              </label>
                              <div className="flex items-center gap-3">
                                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-orange-300 hover:text-orange-600">
                                  Upload de foto
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => void handleSelecionarFoto(bico.id, event.target.files?.[0])}
                                  />
                                </label>

                                {entry?.fotoUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => setImagemAmpliada(entry.fotoUrl ?? null)}
                                    className="overflow-hidden rounded-lg border border-zinc-200"
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
                                ) : null}
                              </div>
                            </div>

                            <div className="md:col-span-full">
                              <label className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                                Observações
                              </label>
                              <input
                                type="text"
                                value={entry?.observacoes ?? ''}
                                onChange={(event) => atualizarCampo(bico.id, { observacoes: event.target.value })}
                                placeholder="Observações opcionais"
                                className={inputClassName}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  </div>
                </motion.div>
              );
            })}

            <motion.div {...animation}>
              {!todosBicosPreenchidos ? (
                <p className="mb-3 text-sm font-medium text-amber-700">
                  Preencha o resultado de todos os bicos antes de registrar
                </p>
              ) : null}

              <button
                type="button"
                onClick={handleRegistrarTodas}
                disabled={isPending || !todosBicosPreenchidos}
                className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? 'Registrando aferições...' : 'Registrar todas as aferições'}
              </button>
            </motion.div>
          </div>
        )}

        <CardBase>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Histórico de aferições</h2>
              <p className="text-sm text-zinc-500">Acompanhe os registros recentes do posto selecionado.</p>
            </div>
            {loadingHistorico ? <LoadingSpinner size={20} /> : null}
          </div>

          {!postoId ? (
            <p className="text-sm text-zinc-500">Selecione um posto para visualizar o histórico.</p>
          ) : loadingHistorico ? (
            <div className="flex h-32 items-center justify-center">
              <LoadingSpinner size={28} />
            </div>
          ) : (historico ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhuma aferição registrada para o posto selecionado.</p>
          ) : (
            <div className="space-y-3">
              {(historico ?? []).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.25 }}
                  className="rounded-2xl border border-zinc-200 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-zinc-900">
                        {`Bomba ${formatarNumero(item.bomba)} → Bico ${formatarNumero(item.bico)} — ${formatarProduto(item.produto)}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm text-zinc-600">{`Resultado ${item.resultadoMl} mL`}</p>
                        <BadgeStatus
                          label={item.situacao === 'DENTRO_DA_LEGISLACAO' ? 'DENTRO' : 'FORA'}
                          tone={item.situacao === 'DENTRO_DA_LEGISLACAO' ? 'green' : 'red'}
                        />
                      </div>
                      <p className="text-sm text-zinc-500">
                        {`Responsável: ${getResponsavelLabel(item, session?.user)} — ${formatarDataHora(item.criadoEm)}`}
                      </p>
                    </div>

                    {item.fotoUrl ? (
                      <button
                        type="button"
                        onClick={() => setImagemAmpliada(item.fotoUrl ?? null)}
                        className="overflow-hidden rounded-xl border border-zinc-200"
                      >
                        <Image
                          src={item.fotoUrl}
                          alt={`Foto da aferição ${item.id}`}
                          width={40}
                          height={40}
                          unoptimized
                          className="h-10 w-10 object-cover"
                        />
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardBase>
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
