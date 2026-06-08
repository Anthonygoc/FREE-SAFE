'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

export interface Posto {
  id: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  uf: string;
  conformidade: number;
}

export function usePostos(enabled = true) {
  return useQuery({
    queryKey: ['postos'],
    queryFn: () => apiClient.get<Posto[]>('/api/postos'),
    enabled,
  });
}
