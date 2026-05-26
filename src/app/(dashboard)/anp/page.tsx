'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Fuel, Gauge } from 'lucide-react';

import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePostos } from '@/hooks/use-postos';
import { useCreateRAQ, useRAQsByPosto } from '@/hooks/use-raq';

type ProdutoTela = 'GASOLINA' | 'ETANOL' | 'DIESEL';

const animation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

export default function AnpPage() {
  const { data: postos, isLoading: loadingPostos } = usePostos();
  const [postoId, setPostoId] = useState('');
  const [produto, setProduto] = useState<ProdutoTela>('GASOLINA');
  const [temperatura, setTemperatura] = useState('20');
  const [densidade, setDensidade] = useState('0.74');
  const [faseAquosa, setFaseAquosa] = useState('50');
  const [teorAlcoolico, setTeorAlcoolico] = useState('93');
  const [aspecto, setAspecto] = useState<'LIQUIDO_E_ISENTO' | 'TURVO' | 'COM_IMPUREZAS'>('LIQUIDO_E_ISENTO');
  const [cor, setCor] = useState<'CARACTERISTICA' | 'ALTERADA'>('CARACTERISTICA');
  const [raqIdCriado, setRaqIdCriado] = useState<string | null>(null);

  useEffect(() => {
    if (!postoId && postos && postos.length > 0) {
      setPostoId(postos[0].id);
    }
  }, [postos, postoId]);

  const { data: historico, isLoading: loadingHistorico } = useRAQsByPosto(postoId);
  const { mutate: createRAQ, data: createOutput, isPending } = useCreateRAQ();

  const fase = Number(faseAquosa || 0);
  const teorEtanolGasolina = useMemo(() => ((fase - 50) * 2) + 1, [fase]);

  const statusAprovado = useMemo(() => {
    const dens = Number(densidade || 0);
    const teorEtanol = teorEtanolGasolina;
    const teorEtanolHidratado = Number(teorAlcoolico || 0);

    if (produto === 'GASOLINA') {
      return teorEtanol >= 27 && teorEtanol <= 35 && aspecto === 'LIQUIDO_E_ISENTO' && cor === 'CARACTERISTICA';
    }
    if (produto === 'ETANOL') {
      return teorEtanolHidratado >= 92.5 && teorEtanolHidratado <= 95.4 && dens >= 0.79 && dens <= 0.82;
    }
    return dens >= 0.82 && dens <= 0.9 && aspecto === 'LIQUIDO_E_ISENTO' && cor === 'CARACTERISTICA';
  }, [produto, densidade, teorEtanolGasolina, teorAlcoolico, aspecto, cor]);

  function mapProdutoApi(): 'GASOLINA_COMUM' | 'ETANOL_HIDRATADO' | 'DIESEL_S10' {
    if (produto === 'GASOLINA') return 'GASOLINA_COMUM';
    if (produto === 'ETANOL') return 'ETANOL_HIDRATADO';
    return 'DIESEL_S10';
  }

  function handleRegistrar() {
    if (!postoId) return;

    createRAQ(
      {
        postoId,
        produto: mapProdutoApi(),
        temperaturaObservada: Number(temperatura || 0),
        densidadeObservada: Number(densidade || 0),
        aspecto,
        cor,
        faseAquosa: produto === 'GASOLINA' ? Number(faseAquosa || 0) : undefined,
        teorAlcoolico: produto === 'ETANOL' ? Number(teorAlcoolico || 0) : undefined,
      },
      {
        onSuccess: (output) => {
          setRaqIdCriado(output.raqId);
        },
      },
    );
  }

  if (loadingPostos || loadingHistorico) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size={30} />
      </div>
    );
  }

  return (
    <motion.div {...animation} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">ANP / RAQ</h1>
        <p className="mt-1 text-zinc-500">Registro de análise de qualidade por produto.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <CardBase>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Posto</label>
            <select
              value={postoId}
              onChange={(e) => setPostoId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-orange-500"
            >
              {(postos ?? []).map((posto) => (
                <option key={posto.id} value={posto.id}>
                  {posto.nome}
                </option>
              ))}
            </select>
          </CardBase>

          <CardBase>
            <p className="mb-3 text-sm font-semibold text-zinc-700">Produto</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => setProduto('GASOLINA')} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${produto === 'GASOLINA' ? 'border-orange-500 bg-orange-500 text-white' : 'border-zinc-200 bg-white text-zinc-700'}`}>
                <Fuel className="h-4 w-4" /> Gasolina
              </button>
              <button type="button" onClick={() => setProduto('ETANOL')} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${produto === 'ETANOL' ? 'border-orange-500 bg-orange-500 text-white' : 'border-zinc-200 bg-white text-zinc-700'}`}>
                <Droplets className="h-4 w-4" /> Etanol
              </button>
              <button type="button" onClick={() => setProduto('DIESEL')} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${produto === 'DIESEL' ? 'border-orange-500 bg-orange-500 text-white' : 'border-zinc-200 bg-white text-zinc-700'}`}>
                <Gauge className="h-4 w-4" /> Diesel
              </button>
            </div>
          </CardBase>

          <CardBase>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Temperatura observada</label>
                <input value={temperatura} onChange={(e) => setTemperatura(e.target.value)} type="number" step="0.1" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Densidade observada</label>
                <input value={densidade} onChange={(e) => setDensidade(e.target.value)} type="number" step="0.001" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
              </div>

              {produto === 'GASOLINA' ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Fase aquosa (ml)</label>
                  <input value={faseAquosa} onChange={(e) => setFaseAquosa(e.target.value)} type="number" step="0.1" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
                  <p className="mt-1 text-xs text-zinc-500">Teor calculado: {teorEtanolGasolina.toFixed(2)}%</p>
                </div>
              ) : null}

              {produto === 'ETANOL' ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Teor alcoólico (INPM)</label>
                  <input value={teorAlcoolico} onChange={(e) => setTeorAlcoolico(e.target.value)} type="number" step="0.1" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Aspecto</label>
                <select value={aspecto} onChange={(e) => setAspecto(e.target.value as 'LIQUIDO_E_ISENTO' | 'TURVO' | 'COM_IMPUREZAS')} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500">
                  <option value="LIQUIDO_E_ISENTO">Líquido e isento</option>
                  <option value="TURVO">Turvo</option>
                  <option value="COM_IMPUREZAS">Com impurezas</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Cor</label>
                <select value={cor} onChange={(e) => setCor(e.target.value as 'CARACTERISTICA' | 'ALTERADA')} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500">
                  <option value="CARACTERISTICA">Característica</option>
                  <option value="ALTERADA">Alterada</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={handleRegistrar} disabled={isPending} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
                {isPending ? 'Salvando...' : 'Registrar análise'}
              </button>
              {raqIdCriado ? (
                <button type="button" onClick={() => window.open(`/api/raq/${raqIdCriado}/pdf`, '_blank')} className="rounded-xl border border-orange-500 bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                  Emitir RAQ em PDF
                </button>
              ) : null}
            </div>
          </CardBase>
        </div>

        <div>
          <div className="rounded-2xl bg-zinc-950 p-5 text-white shadow-sm">
            <p className="text-sm text-zinc-400">Resultado automático</p>
            <div className="mt-3">
              <BadgeStatus label={statusAprovado ? 'Aprovado' : 'Reprovado'} tone={statusAprovado ? 'green' : 'red'} />
            </div>
            <p className="mt-3 text-sm text-zinc-300">
              Preview em tempo real com base nos campos preenchidos.
            </p>
            {createOutput ? (
              <p className="mt-2 text-xs text-zinc-400">Último resultado salvo: {createOutput.resultado}</p>
            ) : null}
          </div>
        </div>
      </div>

      <CardBase>
        <h2 className="text-lg font-bold text-zinc-900">Histórico de RAQs</h2>
        <div className="mt-4 space-y-3">
          {(historico ?? []).map((item) => (
            <div key={item.id} className="rounded-xl border border-zinc-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-900">{item.produto}</p>
                <BadgeStatus label={item.resultado === 'APROVADO' ? 'Aprovado' : 'Reprovado'} tone={item.resultado === 'APROVADO' ? 'green' : 'red'} />
              </div>
              <p className="mt-1 text-xs text-zinc-500">{new Date(item.criadoEm).toLocaleString('pt-BR')}</p>
            </div>
          ))}
          {(historico ?? []).length === 0 ? <p className="text-sm text-zinc-500">Nenhum RAQ para o posto selecionado.</p> : null}
        </div>
      </CardBase>
    </motion.div>
  );
}
