'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

export interface PostoDetalhe {
  id: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual?: string | null;
  endereco: string;
  cidade: string;
  uf: string;
  gerenteId?: string | null;
  maxGerentes: number;
  maxAdministrativos: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface UpdatePostoInput {
  id: string;
  nome: string;
  razaoSocial: string;
  inscricaoEstadual?: string | null;
  endereco: string;
  cidade: string;
  uf: string;
  maxGerentes: number;
  maxAdministrativos: number;
}

export function usePostos(enabled = true) {
  return useQuery({
    queryKey: ['postos'],
    queryFn: () => apiClient.get<Posto[]>('/api/postos'),
    enabled,
  });
}

export function usePosto(id?: string) {
  return useQuery({
    queryKey: ['posto', id],
    queryFn: () => apiClient.get<PostoDetalhe>(`/api/postos/${id}`),
    enabled: !!id,
  });
}

export function useUpdatePosto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdatePostoInput) =>
      apiClient.patch<{ id: string }>(`/api/postos/${id}`, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['postos'] });
      queryClient.invalidateQueries({ queryKey: ['posto', variables.id] });
      toast.success('Configurações do posto atualizadas com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar posto.');
    },
  });
}
