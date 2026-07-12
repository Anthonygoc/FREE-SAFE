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

export interface BombaComBicos {
  id: string;
  numero: number;
  modelo?: string;
  bicos: Array<{
    id: string;
    numero: number;
    produto: ProdutoCombustivel;
    capacidade?: number;
  }>;
}

export interface CreateBombaInput {
  postoId: string;
  numero: number;
  modelo?: string;
}

export interface CreateBombaOutput {
  id: string;
  acao: 'criada' | 'reativada';
}

export interface CreateBicoInput {
  bombaId: string;
  numero: number;
  produto: ProdutoCombustivel;
  capacidade?: number;
}

export interface CreateBicoOutput {
  id: string;
  acao: 'criado' | 'reativado';
}

export interface UpdateBicoInput {
  bombaId: string;
  bicoId: string;
  numero: number;
  produto: ProdutoCombustivel;
  capacidade?: number;
}

export interface UpdateBombaInput {
  bombaId: string;
  numero?: number;
  modelo?: string;
}

export interface DeleteEntityOutput {
  deletado: true;
  acao: 'excluida' | 'desativada';
}

export function useBombasByPosto(postoId?: string) {
  return useQuery({
    queryKey: ['bombas', postoId],
    queryFn: () => apiClient.get<BombaComBicos[]>(`/api/bombas?postoId=${postoId}`),
    enabled: !!postoId,
  });
}

export function useCreateBomba() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBombaInput) => apiClient.post<CreateBombaOutput>('/api/bombas', input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bombas'] });
      toast.success(data.acao === 'reativada' ? 'Bomba reativada.' : 'Bomba adicionada com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar bomba.');
    },
  });
}

export function useCreateBico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBicoInput) =>
      apiClient.post<CreateBicoOutput>(`/api/bombas/${input.bombaId}/bicos`, {
        numero: input.numero,
        produto: input.produto,
        capacidade: input.capacidade,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bombas'] });
      toast.success(data.acao === 'reativado' ? 'Bico reativado.' : 'Bico adicionado com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar bico.');
    },
  });
}

export function useUpdateBico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBicoInput) =>
      apiClient.patch<{ id: string }>(`/api/bombas/${input.bombaId}/bicos/${input.bicoId}`, {
        numero: input.numero,
        produto: input.produto,
        capacidade: input.capacidade,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bombas'] });
      toast.success('Bico atualizado com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar bico.');
    },
  });
}

export function useUpdateBomba() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBombaInput) =>
      apiClient.patch<{ id: string }>(`/api/bombas/${input.bombaId}`, {
        numero: input.numero,
        modelo: input.modelo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bombas'] });
      toast.success('Bomba atualizada com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar bomba.');
    },
  });
}

export function useDeleteBico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bombaId, bicoId }: { bombaId: string; bicoId: string }) =>
      apiClient.delete<DeleteEntityOutput>(`/api/bombas/${bombaId}/bicos/${bicoId}`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bombas'] });
      toast.success(
        data.acao === 'desativada'
          ? 'Bico desativado (historico preservado).'
          : 'Bico excluido com sucesso.',
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir bico.');
    },
  });
}

export function useDeleteBomba() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bombaId }: { bombaId: string }) =>
      apiClient.delete<DeleteEntityOutput>(`/api/bombas/${bombaId}`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bombas'] });
      toast.success(
        data.acao === 'desativada'
          ? 'Bomba desativada (historico preservado).'
          : 'Bomba excluida com sucesso.',
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir bomba.');
    },
  });
}
