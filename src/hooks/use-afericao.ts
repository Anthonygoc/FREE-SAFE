'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';

type ProdutoCombustivel =
  | 'GASOLINA_COMUM'
  | 'GASOLINA_ADITIVADA'
  | 'GASOLINA_PREMIUM'
  | 'ETANOL_HIDRATADO'
  | 'DIESEL_S10'
  | 'DIESEL_S500';

type SituacaoAfericao = 'DENTRO_DA_LEGISLACAO' | 'FORA_DA_TOLERANCIA';

export interface Afericao {
  id: string;
  postoId: string;
  responsavelId: string;
  responsavelNome?: string;
  bicoId?: string;
  produto: ProdutoCombustivel;
  bomba: number;
  bico: number;
  medidaPadrao: number;
  resultadoMl: number;
  situacao: SituacaoAfericao;
  observacoes?: string;
  fotoUrl?: string;
  criadoEm: string;
}

export interface CreateAfericaoInput {
  postoId: string;
  bicoId?: string;
  produto: ProdutoCombustivel;
  bomba: number;
  bico: number;
  resultadoMl: number;
  observacoes?: string;
  fotoUrl?: string;
}

export interface CreateAfericaoOutput {
  afericaoId: string;
  situacao: SituacaoAfericao;
  dentro: boolean;
}

export interface CreateAfericaoLoteItemInput {
  bicoId: string;
  produto: ProdutoCombustivel;
  bomba: number;
  bico: number;
  resultadoMl: number;
  observacoes?: string;
  fotoUrl?: string;
}

export interface CreateAfericaoLoteInput {
  postoId: string;
  afericoes: CreateAfericaoLoteItemInput[];
}

export interface CreateAfericaoLoteOutput {
  registradas: number;
  resultados: Array<{
    bicoId: string;
    situacao: SituacaoAfericao;
    dentro: boolean;
  }>;
}

export function useAfericoesByPosto(postoId?: string) {
  return useQuery({
    queryKey: ['afericao', postoId],
    queryFn: () => apiClient.get<Afericao[]>(`/api/afericao?postoId=${postoId}`),
    enabled: !!postoId,
  });
}

export function useCreateAfericao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAfericaoInput) => apiClient.post<CreateAfericaoOutput>('/api/afericao', input),
    onSuccess: (output, input) => {
      queryClient.invalidateQueries({ queryKey: ['afericao', input.postoId] });
      toast.success(`Aferição registrada: ${output.situacao}.`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar aferição.');
    },
  });
}

export function useCreateAfericaoLote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAfericaoLoteInput) =>
      apiClient.post<CreateAfericaoLoteOutput>('/api/afericao/lote', input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ['afericao', input.postoId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar aferições.');
    },
  });
}
