'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';

export type PerfilUsuarioOperacional = 'ADMIN' | 'GERENTE' | 'ADMINISTRATIVO';

export interface UsuarioResumo {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuarioOperacional;
  postoId: string | null;
  ativo: boolean;
  criadoEm: string;
}

export interface CreateUsuarioInput {
  nome: string;
  email: string;
  senha: string;
  perfil: 'GERENTE' | 'ADMINISTRATIVO';
  postoId: string;
}

export interface UpdateUsuarioInput {
  id: string;
  nome?: string;
  perfil?: PerfilUsuarioOperacional;
  postoId?: string;
  ativo?: boolean;
  novaSenha?: string;
}

export function useUsuarios(postoId?: string, enabled = true) {
  return useQuery({
    queryKey: ['usuarios', postoId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (postoId) {
        params.set('postoId', postoId);
      }

      const path = params.toString() ? `/api/usuarios?${params.toString()}` : '/api/usuarios';
      return apiClient.get<UsuarioResumo[]>(path);
    },
    enabled,
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUsuarioInput) =>
      apiClient.post<{ id: string }>('/api/usuarios', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário criado com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar usuário.');
    },
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateUsuarioInput) =>
      apiClient.patch<{ id: string }>(`/api/usuarios/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário atualizado com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar usuário.');
    },
  });
}

export function useToggleUsuarioAtivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      apiClient.patch<{ id: string }>(`/api/usuarios/${id}`, { ativo }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success(variables.ativo ? 'Usuário ativado com sucesso.' : 'Usuário desativado com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar status do usuário.');
    },
  });
}
