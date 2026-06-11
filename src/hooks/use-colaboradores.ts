'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';

type StatusColaborador = 'ATIVO' | 'AFASTADO' | 'DESLIGADO';

export interface Colaborador {
  id: string;
  postoId: string;
  userId?: string;
  nome: string;
  cpf: string;
  rg?: string;
  fotoUrl?: string;
  cargo: string;
  dataAdmissao: string;
  status: StatusColaborador;
  turno?: string;
  escala?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  criadoEm: string;
}

export interface CreateColaboradorInput {
  postoId: string;
  nome: string;
  cpf: string;
  fotoUrl?: string;
  cargo: string;
  dataAdmissao: string;
  turno?: string;
  telefone?: string;
  email?: string;
}

export interface UpdateColaboradorInput {
  id: string;
  nome?: string;
  cpf?: string;
  cargo?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  turno?: string;
  escala?: string;
  status?: StatusColaborador;
  fotoUrl?: string;
}

export function useColaboradores(postoId?: string, cargo?: string, status?: StatusColaborador) {
  return useQuery({
    queryKey: ['colaboradores', postoId, cargo, status],
    queryFn: () => {
      const params = new URLSearchParams({ postoId: postoId ?? '' });
      if (cargo) params.set('cargo', cargo);
      if (status) params.set('status', status);
      return apiClient.get<Colaborador[]>(`/api/colaboradores?${params.toString()}`);
    },
    enabled: !!postoId,
  });
}

export function useColaborador(id?: string) {
  return useQuery({
    queryKey: ['colaborador', id],
    queryFn: () => apiClient.get<Colaborador>(`/api/colaboradores/${id}`),
    enabled: !!id,
  });
}

export function useCreateColaborador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateColaboradorInput) => apiClient.post<{ id: string }>('/api/colaboradores', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador cadastrado com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar colaborador.');
    },
  });
}

export function useUpdateColaborador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateColaboradorInput) =>
      apiClient.patch<{ id: string }>(`/api/colaboradores/${id}`, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      queryClient.invalidateQueries({ queryKey: ['colaborador', variables.id] });
      toast.success('Colaborador atualizado com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar colaborador.');
    },
  });
}
