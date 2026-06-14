'use client';

import { motion } from 'framer-motion';
import { Check, Plus, Save, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { RouteGuard } from '@/components/auth/route-guard';
import { CardBase } from '@/components/ui/card-base';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  useBombasByPosto,
  useCreateBico,
  useCreateBomba,
  useDeleteBico,
  useDeleteBomba,
  useUpdateBico,
  useUpdateBomba,
  type BombaComBicos,
} from '@/hooks/use-bombas';
import { usePostos } from '@/hooks/use-postos';

const animation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

const inputClassName =
  'w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-orange-500';
const iconButtonClassName =
  'inline-flex items-center justify-center rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60';
const primaryButtonClassName =
  'inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60';
const dangerButtonClassName =
  'inline-flex items-center justify-center rounded-xl px-3 py-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60';

const produtosOptions = [
  'GASOLINA_COMUM',
  'GASOLINA_ADITIVADA',
  'GASOLINA_PREMIUM',
  'ETANOL_HIDRATADO',
  'DIESEL_S10',
  'DIESEL_S500',
] as const;

type ProdutoCombustivel = (typeof produtosOptions)[number];

type BicoDraftState = Record<string, {
  produto: ProdutoCombustivel | '';
  capacidade: string;
}>;

type BombaDraftState = Record<string, {
  numero: string;
  modelo: string;
}>;

type NovoBicoDraftState = Record<string, {
  produto: ProdutoCombustivel | '';
  capacidade: string;
}>;

function formatarNumero(value: number) {
  return value.toString().padStart(2, '0');
}

function formatarProduto(produto: ProdutoCombustivel) {
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

function buildBicoDraftState(bombas: BombaComBicos[] | undefined): BicoDraftState {
  const nextState: BicoDraftState = {};

  for (const bomba of bombas ?? []) {
    for (const bico of bomba.bicos) {
      nextState[bico.id] = {
        produto: bico.produto,
        capacidade: bico.capacidade === undefined ? '' : String(bico.capacidade),
      };
    }
  }

  return nextState;
}

function buildBombaDraftState(bombas: BombaComBicos[] | undefined): BombaDraftState {
  const nextState: BombaDraftState = {};

  for (const bomba of bombas ?? []) {
    nextState[bomba.id] = {
      numero: String(bomba.numero),
      modelo: bomba.modelo ?? '',
    };
  }

  return nextState;
}

function buildNovoBicoDraftState(bombas: BombaComBicos[] | undefined): NovoBicoDraftState {
  const nextState: NovoBicoDraftState = {};

  for (const bomba of bombas ?? []) {
    nextState[bomba.id] = {
      produto: '',
      capacidade: '',
    };
  }

  return nextState;
}

export default function ConfigurarBombasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAllowed = session?.user?.perfil === 'ADMIN' || session?.user?.perfil === 'GERENTE';
  const { data: postos, isLoading: loadingPostos } = usePostos(isAllowed);
  const { mutate: createBomba, isPending: creatingBomba } = useCreateBomba();
  const { mutate: createBico, isPending: creatingBico } = useCreateBico();
  const { mutate: updateBico, isPending: updatingBico } = useUpdateBico();
  const { mutate: updateBomba, isPending: updatingBomba } = useUpdateBomba();
  const { mutate: deleteBico, isPending: deletingBico } = useDeleteBico();
  const { mutate: deleteBomba, isPending: deletingBomba } = useDeleteBomba();

  const [postoId, setPostoId] = useState('');
  const [bicoDrafts, setBicoDrafts] = useState<BicoDraftState>({});
  const [bombaDrafts, setBombaDrafts] = useState<BombaDraftState>({});
  const [novosBicos, setNovosBicos] = useState<NovoBicoDraftState>({});
  const [savingBicoId, setSavingBicoId] = useState<string | null>(null);
  const [savingBombaId, setSavingBombaId] = useState<string | null>(null);
  const [addingBicoBombaId, setAddingBicoBombaId] = useState<string | null>(null);
  const [deletingBicoId, setDeletingBicoId] = useState<string | null>(null);
  const [deletingBombaId, setDeletingBombaId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAllowed) {
      router.replace('/inmetro');
    }
  }, [isAllowed, router, status]);

  useEffect(() => {
    if (!postoId && postos && postos.length > 0) {
      setPostoId(postos[0].id);
    }
  }, [postoId, postos]);

  const { data: bombas, isLoading: loadingBombas } = useBombasByPosto(postoId);

  useEffect(() => {
    setBicoDrafts(buildBicoDraftState(bombas));
    setBombaDrafts(buildBombaDraftState(bombas));
    setNovosBicos(buildNovoBicoDraftState(bombas));
  }, [bombas]);

  const postoSelecionado = useMemo(
    () => (postos ?? []).find((posto) => posto.id === postoId),
    [postoId, postos],
  );

  if (status === "loading" || loadingPostos) {
    return (
      <RouteGuard recurso="inmetro">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size={30} />
        </div>
      </RouteGuard>
    );
  }

  function handleChangePosto(nextPostoId: string) {
    setPostoId(nextPostoId);
    setSavingBicoId(null);
    setSavingBombaId(null);
    setAddingBicoBombaId(null);
    setDeletingBicoId(null);
    setDeletingBombaId(null);
  }

  function handleChangeBicoDraft(bicoId: string, field: 'produto' | 'capacidade', value: string) {
    setBicoDrafts((current) => ({
      ...current,
      [bicoId]: {
        produto: field === 'produto'
          ? value as ProdutoCombustivel
          : (current[bicoId]?.produto ?? ''),
        capacidade: field === 'capacidade' ? value : (current[bicoId]?.capacidade ?? ''),
      },
    }));
  }

  function handleChangeBombaDraft(bombaId: string, field: 'numero' | 'modelo', value: string) {
    setBombaDrafts((current) => ({
      ...current,
      [bombaId]: {
        numero: field === 'numero' ? value : (current[bombaId]?.numero ?? ''),
        modelo: field === 'modelo' ? value : (current[bombaId]?.modelo ?? ''),
      },
    }));
  }

  function handleChangeNovoBico(bombaId: string, field: 'produto' | 'capacidade', value: string) {
    setNovosBicos((current) => ({
      ...current,
      [bombaId]: {
        produto: field === 'produto'
          ? value as ProdutoCombustivel | ''
          : (current[bombaId]?.produto ?? ''),
        capacidade: field === 'capacidade' ? value : (current[bombaId]?.capacidade ?? ''),
      },
    }));
  }

  function handleSalvarBico(bombaId: string, bicoId: string) {
    const draft = bicoDrafts[bicoId];
    if (!draft?.produto) {
      toast.error('Selecione um produto para salvar o bico.');
      return;
    }

    setSavingBicoId(bicoId);
    updateBico(
      {
        bombaId,
        bicoId,
        produto: draft.produto,
        capacidade: draft.capacidade.trim() ? Number(draft.capacidade) : undefined,
      },
      {
        onSettled: () => {
          setSavingBicoId(null);
        },
      },
    );
  }

  function handleSalvarBomba(bombaId: string) {
    const draft = bombaDrafts[bombaId];
    if (!draft) {
      return;
    }

    const numero = Number(draft.numero);
    if (!draft.numero.trim() || Number.isNaN(numero) || numero <= 0) {
      toast.error('Informe um numero valido para a bomba.');
      return;
    }

    setSavingBombaId(bombaId);
    updateBomba(
      {
        bombaId,
        numero,
        modelo: draft.modelo.trim() || undefined,
      },
      {
        onSettled: () => {
          setSavingBombaId(null);
        },
      },
    );
  }

  function handleAdicionarBomba() {
    if (!postoId) {
      return;
    }

    const nextNumero = ((bombas ?? []).reduce((max, bomba) => Math.max(max, bomba.numero), 0)) + 1;

    createBomba({
      postoId,
      numero: nextNumero,
    });
  }

  function handleAdicionarBico(bomba: BombaComBicos) {
    const draft = novosBicos[bomba.id];
    if (!draft?.produto) {
      toast.error('Selecione um produto antes de adicionar o bico.');
      return;
    }

    const nextNumero = ((bomba.bicos ?? []).reduce((max, bico) => Math.max(max, bico.numero), 0)) + 1;

    setAddingBicoBombaId(bomba.id);
    createBico(
      {
        bombaId: bomba.id,
        numero: nextNumero,
        produto: draft.produto,
        capacidade: draft.capacidade.trim() ? Number(draft.capacidade) : undefined,
      },
      {
        onSuccess: () => {
          setNovosBicos((current) => ({
            ...current,
            [bomba.id]: {
              produto: '',
              capacidade: '',
            },
          }));
        },
        onSettled: () => {
          setAddingBicoBombaId(null);
        },
      },
    );
  }

  function handleExcluirBico(bombaId: string, bicoId: string) {
    if (!window.confirm('Tem certeza que deseja excluir este bico?')) {
      return;
    }

    setDeletingBicoId(bicoId);
    deleteBico(
      { bombaId, bicoId },
      {
        onSettled: () => {
          setDeletingBicoId(null);
        },
      },
    );
  }

  function handleExcluirBomba(bombaId: string) {
    if (!window.confirm('Tem certeza que deseja excluir esta bomba?')) {
      return;
    }

    setDeletingBombaId(bombaId);
    deleteBomba(
      { bombaId },
      {
        onSettled: () => {
          setDeletingBombaId(null);
        },
      },
    );
  }

  return (
    <RouteGuard recurso="inmetro">
      <motion.div {...animation} className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Configuração de Bombas</h1>
          <p className="mt-1 text-zinc-500">Gerencie bombas e bicos por posto da Rede Free.</p>
        </div>

        <button
          type="button"
          onClick={handleAdicionarBomba}
          disabled={!postoId || creatingBomba}
          className={primaryButtonClassName}
        >
          <Plus className="h-4 w-4" />
          {creatingBomba ? 'Adicionando...' : 'Adicionar bomba'}
        </button>
      </div>

      <CardBase>
        <div className="grid gap-4 md:grid-cols-[minmax(0,360px)_1fr] md:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Posto</label>
            <select
              value={postoId}
              onChange={(event) => handleChangePosto(event.target.value)}
              disabled={session?.user?.perfil === 'GERENTE'}
              className={`${inputClassName} disabled:bg-zinc-50 disabled:text-zinc-500`}
            >
              <option value="">Selecione um posto</option>
              {(postos ?? []).map((posto) => (
                <option key={posto.id} value={posto.id}>
                  {posto.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-zinc-500">
            {postoSelecionado ? `Posto selecionado: ${postoSelecionado.nome}` : 'Selecione um posto para editar as bombas.'}
          </div>
        </div>
      </CardBase>

      {loadingBombas ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size={30} />
        </div>
      ) : (bombas ?? []).length === 0 ? (
        <CardBase>
          <p className="text-sm text-zinc-500">Nenhuma bomba cadastrada para este posto.</p>
        </CardBase>
      ) : (
        <div className="space-y-6">
          {(bombas ?? []).map((bomba) => {
            const bombaDraft = bombaDrafts[bomba.id] ?? {
              numero: String(bomba.numero),
              modelo: bomba.modelo ?? '',
            };
            const novoBico = novosBicos[bomba.id] ?? { produto: '', capacidade: '' };
            const nextNumero = ((bomba.bicos ?? []).reduce((max, bico) => Math.max(max, bico.numero), 0)) + 1;

            return (
              <CardBase key={bomba.id}>
                <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div className="grid flex-1 gap-4 md:grid-cols-[160px_minmax(220px,1fr)]">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700">Numero da bomba</label>
                      <input
                        type="number"
                        min="1"
                        value={bombaDraft.numero}
                        onChange={(event) => handleChangeBombaDraft(bomba.id, 'numero', event.target.value)}
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700">Nome / modelo da bomba</label>
                      <input
                        type="text"
                        placeholder="Ex.: Wayne Helix 6000"
                        value={bombaDraft.modelo}
                        onChange={(event) => handleChangeBombaDraft(bomba.id, 'modelo', event.target.value)}
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSalvarBomba(bomba.id)}
                      disabled={updatingBomba && savingBombaId === bomba.id}
                      className={primaryButtonClassName}
                    >
                      <Save className="h-4 w-4" />
                      {updatingBomba && savingBombaId === bomba.id ? 'Salvando...' : 'Salvar'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExcluirBomba(bomba.id)}
                      disabled={deletingBomba && deletingBombaId === bomba.id}
                      className={dangerButtonClassName}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                  <table className="min-w-full divide-y divide-zinc-200 text-sm">
                    <thead className="bg-zinc-50 text-left text-zinc-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Bico</th>
                        <th className="px-4 py-3 font-semibold">Produto</th>
                        <th className="px-4 py-3 font-semibold">Capacidade</th>
                        <th className="px-4 py-3 font-semibold">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {bomba.bicos.map((bico) => {
                        const draft = bicoDrafts[bico.id] ?? {
                          produto: bico.produto,
                          capacidade: bico.capacidade === undefined ? '' : String(bico.capacidade),
                        };

                        return (
                          <tr key={bico.id}>
                            <td className="px-4 py-3 font-medium text-zinc-900">{`Bico ${formatarNumero(bico.numero)}`}</td>
                            <td className="px-4 py-3">
                              <select
                                value={draft.produto}
                                onChange={(event) => handleChangeBicoDraft(bico.id, 'produto', event.target.value)}
                                className={inputClassName}
                              >
                                {produtosOptions.map((produto) => (
                                  <option key={produto} value={produto}>
                                    {formatarProduto(produto)}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={draft.capacidade}
                                onChange={(event) => handleChangeBicoDraft(bico.id, 'capacidade', event.target.value)}
                                type="number"
                                placeholder="Opcional"
                                className={inputClassName}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSalvarBico(bomba.id, bico.id)}
                                  disabled={updatingBico && savingBicoId === bico.id}
                                  className={iconButtonClassName}
                                >
                                  {updatingBico && savingBicoId === bico.id ? (
                                    'Salvando...'
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4" />
                                      Salvar
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleExcluirBico(bomba.id, bico.id)}
                                  disabled={deletingBico && deletingBicoId === bico.id}
                                  className={dangerButtonClassName}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      <tr className="bg-orange-50/40">
                        <td className="px-4 py-3 font-medium text-zinc-900">{`Bico ${formatarNumero(nextNumero)}`}</td>
                        <td className="px-4 py-3">
                          <select
                            value={novoBico.produto}
                            onChange={(event) => handleChangeNovoBico(bomba.id, 'produto', event.target.value)}
                            className={inputClassName}
                          >
                            <option value="">Selecione o produto</option>
                            {produtosOptions.map((produto) => (
                              <option key={produto} value={produto}>
                                {formatarProduto(produto)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={novoBico.capacidade}
                            onChange={(event) => handleChangeNovoBico(bomba.id, 'capacidade', event.target.value)}
                            type="number"
                            placeholder="Opcional"
                            className={inputClassName}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleAdicionarBico(bomba)}
                            disabled={creatingBico && addingBicoBombaId === bomba.id}
                            className={primaryButtonClassName}
                          >
                            <Plus className="h-4 w-4" />
                            {creatingBico && addingBicoBombaId === bomba.id ? 'Adicionando...' : 'Adicionar bico'}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardBase>
            );
          })}
        </div>
      )}
      </motion.div>
    </RouteGuard>
  );
}
