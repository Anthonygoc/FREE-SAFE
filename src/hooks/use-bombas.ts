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
    numeroSequencial: number;
    produto: ProdutoCombustivel;
    capacidade?: number;
  }>;
}

export interface CreateBombaInput {
  postoId: string;
  numero: number;
  modelo?: string;
}

export interface CreateBicoInput {
  bombaId: string;
  numero: number;
  produto: ProdutoCombustivel;
  capacidade?: number;
}

export interface UpdateBicoInput {
  bombaId: string;
  bicoId: string;
  produto: ProdutoCombustivel;
  capacidade?: number;
}

export interface UpdateBombaInput {
  bombaId: string;
  numero?: number;
  modelo?: string;
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
    mutationFn: (input: CreateBombaInput) => apiClient.post<{ id: string }>('/api/bombas', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bombas'] });
      toast.success('Bomba adicionada com sucesso.');
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
      apiClient.post<{ id: string }>(`/api/bombas/${input.bombaId}/bicos`, {
        numero: input.numero,
        produto: input.produto,
        capacidade: input.capacidade,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bombas'] });
      toast.success('Bico adicionado com sucesso.');
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
      apiClient.delete<{ deletado: true }>(`/api/bombas/${bombaId}/bicos/${bicoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bombas'] });
      toast.success('Bico excluido com sucesso.');
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
      apiClient.delete<{ deletado: true }>(`/api/bombas/${bombaId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bombas'] });
      toast.success('Bomba excluida com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir bomba.');
    },
  });
}
