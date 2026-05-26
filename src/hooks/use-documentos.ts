'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

type StatusDocumento = 'VALIDO' | 'VENCENDO' | 'VENCIDO';

export interface Documento {
  id: string;
  postoId: string;
  tipo: string;
  numero?: string;
  dataEmissao?: string;
  dataVencimento?: string;
  arquivoUrl?: string;
  status: StatusDocumento;
  criadoEm: string;
  atualizadoEm: string;
}

export function useDocumentos(postoId?: string, vencendo?: number) {
  return useQuery({
    queryKey: ['documentos', postoId, vencendo],
    queryFn: () => {
      const params = new URLSearchParams({ postoId: postoId ?? '' });
      if (vencendo) params.set('vencendo', String(vencendo));
      return apiClient.get<Documento[]>(`/api/documentos?${params.toString()}`);
    },
    enabled: !!postoId,
  });
}
