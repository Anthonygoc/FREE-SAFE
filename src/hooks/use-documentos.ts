'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';

type StatusDocumento = 'VALIDO' | 'VENCENDO' | 'VENCIDO';

export interface Documento {
  id: string;
  postoId: string;
  categoriaId: string;
  categoriaNome: string;
  titulo: string;
  numero?: string;
  dataEmissao?: string;
  dataVencimento?: string;
  arquivoUrl?: string;
  status: StatusDocumento;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CategoriaDocumento {
  id: string;
  nome: string;
  descricao?: string;
}

export interface CreateCategoriaInput {
  nome: string;
  descricao?: string;
}

export interface CreateDocumentoInput {
  postoId: string;
  categoriaId: string;
  titulo: string;
  numero?: string;
  dataEmissao?: string;
  dataVencimento?: string;
  arquivoUrl?: string;
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

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: () => apiClient.get<CategoriaDocumento[]>('/api/categorias-documento'),
  });
}

export function useCreateCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoriaInput) =>
      apiClient.post<CategoriaDocumento>('/api/categorias-documento', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar categoria.');
    },
  });
}

export function useCreateDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDocumentoInput) =>
      apiClient.post<{ id: string }>('/api/documentos', input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos', variables.postoId] });
      toast.success('Documento salvo com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar documento.');
    },
  });
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<{ deletado: true }>(`/api/documentos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      toast.success('Documento excluido com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir documento.');
    },
  });
}
