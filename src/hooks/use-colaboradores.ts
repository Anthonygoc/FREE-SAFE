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
  cargo: string;
  dataAdmissao: string;
  turno?: string;
  telefone?: string;
  email?: string;
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

export function useCreateColaborador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateColaboradorInput) => apiClient.post<{ id: string }>('/api/colaboradores', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador cadastrado com sucesso.');
    },
  });
}
