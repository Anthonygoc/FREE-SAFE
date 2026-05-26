'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useCreateAfericao } from '@/hooks/use-afericao';
import { usePostos } from '@/hooks/use-postos';

const animation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

export default function InmetroPage() {
  const { data: postos, isLoading: loadingPostos } = usePostos();
  const { mutate: createAfericao, isPending } = useCreateAfericao();

  const [postoId, setPostoId] = useState('');
  const [produto, setProduto] = useState<'GASOLINA_COMUM' | 'ETANOL_HIDRATADO' | 'DIESEL_S10'>('GASOLINA_COMUM');
  const [bomba, setBomba] = useState('1');
  const [bico, setBico] = useState('1');
  const [resultadoMl, setResultadoMl] = useState('0');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (!postoId && postos && postos.length > 0) {
      setPostoId(postos[0].id);
    }
  }, [postos, postoId]);

  const dentro = Number(resultadoMl || 0) >= -100 && Number(resultadoMl || 0) <= 100;

  function handleRegistrar() {
    if (!postoId) return;
    createAfericao({
      postoId,
      produto,
      bomba: Number(bomba || 0),
      bico: Number(bico || 0),
      resultadoMl: Number(resultadoMl || 0),
      observacoes: observacoes || undefined,
    });
  }

  if (loadingPostos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size={30} />
      </div>
    );
  }

  return (
    <motion.div {...animation} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">INMETRO</h1>
        <p className="mt-1 text-zinc-500">Registro de aferição de bombas.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CardBase>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Posto</label>
                <select value={postoId} onChange={(e) => setPostoId(e.target.value)} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500">
                  {(postos ?? []).map((posto) => (
                    <option key={posto.id} value={posto.id}>
                      {posto.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Produto</label>
                <select value={produto} onChange={(e) => setProduto(e.target.value as 'GASOLINA_COMUM' | 'ETANOL_HIDRATADO' | 'DIESEL_S10')} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500">
                  <option value="GASOLINA_COMUM">Gasolina</option>
                  <option value="ETANOL_HIDRATADO">Etanol</option>
                  <option value="DIESEL_S10">Diesel</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Bomba</label>
                <input value={bomba} onChange={(e) => setBomba(e.target.value)} type="number" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Bico</label>
                <input value={bico} onChange={(e) => setBico(e.target.value)} type="number" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Resultado (ml)</label>
                <input value={resultadoMl} onChange={(e) => setResultadoMl(e.target.value)} type="number" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700">Observações</label>
                <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
              </div>
            </div>
            <div className="mt-4">
              <button type="button" onClick={handleRegistrar} disabled={isPending} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
                {isPending ? 'Salvando...' : 'Registrar aferição'}
              </button>
            </div>
          </CardBase>
        </div>

        <div>
          <div className={`rounded-2xl p-5 shadow-sm ${dentro ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
            <p className="text-sm font-semibold">Resultado automático</p>
            <div className="mt-2">
              <BadgeStatus label={dentro ? 'Dentro da legislação' : 'Fora da tolerância'} tone={dentro ? 'green' : 'red'} />
            </div>
            <p className="mt-3 text-sm">{dentro ? 'A medição está dentro da faixa permitida de -100ml a +100ml.' : 'A medição excedeu a faixa permitida de -100ml a +100ml.'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
