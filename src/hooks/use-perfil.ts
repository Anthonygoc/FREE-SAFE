'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';

export interface MeuPerfil {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  postoId: string | null;
  postoNome: string | null;
}

export interface UpdateMeuPerfilInput {
  nome?: string;
  email?: string;
}

export function useMeuPerfil() {
  return useQuery({
    queryKey: ['perfil'],
    queryFn: () => apiClient.get<MeuPerfil>('/api/perfil'),
  });
}

export function useUpdateMeuPerfil() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { update } = useSession();

  return useMutation({
    mutationFn: (input: UpdateMeuPerfilInput) =>
      apiClient.patch<MeuPerfil>('/api/perfil', input),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['perfil'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });

      try {
        await update({
          name: data.nome,
          email: data.email,
        });
      } catch {
        // The profile update succeeded; session refresh is best effort.
      }

      router.refresh();
      toast.success('Perfil atualizado com sucesso.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar perfil.');
    },
  });
}
