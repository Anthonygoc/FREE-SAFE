'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

export interface NotificacaoItem {
  id: string;
  tipo: 'documento';
  severidade: 'critico' | 'atencao';
  titulo: string;
  descricao: string;
  postoNome?: string;
  link: string;
  data: string;
}

export interface NotificacoesResumo {
  itens: NotificacaoItem[];
  total: number;
  criticos: number;
}

export function useNotificacoes() {
  return useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => apiClient.get<NotificacoesResumo>('/api/notificacoes'),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
