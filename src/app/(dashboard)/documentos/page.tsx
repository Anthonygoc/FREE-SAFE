'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileText } from 'lucide-react';

import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useDocumentos } from '@/hooks/use-documentos';
import { usePostos } from '@/hooks/use-postos';

const statusTone = {
  VALIDO: 'green',
  VENCENDO: 'yellow',
  VENCIDO: 'red',
} as const;

export default function DocumentosPage() {
  const { data: postos, isLoading: loadingPostos } = usePostos();
  const [postoId, setPostoId] = useState('');

  useEffect(() => {
    if (!postoId && postos && postos.length > 0) {
      setPostoId(postos[0].id);
    }
  }, [postos, postoId]);

  const { data: documentos, isLoading: loadingDocumentos } = useDocumentos(postoId);
  const { data: vencendo30, isLoading: loadingVencendo30 } = useDocumentos(postoId, 30);

  const totalVencendo = useMemo(
    () => (vencendo30 ?? []).filter((doc) => doc.status === 'VENCENDO' || doc.status === 'VENCIDO').length,
    [vencendo30],
  );

  if (loadingPostos || loadingDocumentos || loadingVencendo30) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size={30} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Documentos</h1>
        <p className="mt-1 text-zinc-500">Controle de vigência documental por posto.</p>
      </div>

      <CardBase>
        <label className="mb-2 block text-sm font-medium text-zinc-700">Posto</label>
        <select
          value={postoId}
          onChange={(e) => setPostoId(e.target.value)}
          className="w-full max-w-md rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-orange-500"
        >
          {(postos ?? []).map((posto) => (
            <option key={posto.id} value={posto.id}>
              {posto.nome}
            </option>
          ))}
        </select>
      </CardBase>

      {totalVencendo > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="text-sm font-semibold">Alerta: {totalVencendo} documento(s) vencendo em até 30 dias.</p>
        </div>
      ) : null}

      {(documentos ?? []).length === 0 ? (
        <CardBase>
          <EmptyState icon={FileText} title="Sem documentos" description="Não há documentos cadastrados para o posto selecionado." />
        </CardBase>
      ) : (
        <div className="space-y-3">
          {(documentos ?? []).map((documento) => (
            <CardBase key={documento.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-bold text-zinc-900">{documento.tipo}</p>
                  <p className="mt-1 text-sm text-zinc-500">Número: {documento.numero ?? '-'}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Vencimento:{' '}
                    {documento.dataVencimento ? new Date(documento.dataVencimento).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <BadgeStatus label={documento.status} tone={statusTone[documento.status]} />
              </div>
              {documento.status !== 'VALIDO' ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Atenção ao vencimento deste documento
                </div>
              ) : null}
            </CardBase>
          ))}
        </div>
      )}
    </div>
  );
}
