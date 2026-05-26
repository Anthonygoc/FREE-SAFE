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

type ResultadoAnalise = 'APROVADO' | 'REPROVADO';

export interface RAQ {
  id: string;
  postoId: string;
  responsavelId: string;
  produto: ProdutoCombustivel;
  temperaturaObservada: number;
  densidadeObservada: number;
  aspecto: 'LIQUIDO_E_ISENTO' | 'TURVO' | 'COM_IMPUREZAS';
  cor: 'CARACTERISTICA' | 'ALTERADA';
  faseAquosa?: number;
  teorAlcoolico?: number;
  distribuidora?: string;
  notaFiscal?: string;
  placaCaminhao?: string;
  tanqueDestino?: string;
  resultado: ResultadoAnalise;
  criadoEm: string;
}

export interface CreateRAQInput {
  postoId: string;
  produto: ProdutoCombustivel;
  temperaturaObservada: number;
  densidadeObservada: number;
  aspecto: 'LIQUIDO_E_ISENTO' | 'TURVO' | 'COM_IMPUREZAS';
  cor: 'CARACTERISTICA' | 'ALTERADA';
  faseAquosa?: number;
  teorAlcoolico?: number;
  distribuidora?: string;
  notaFiscal?: string;
  placaCaminhao?: string;
  tanqueDestino?: string;
}

export interface CreateRAQOutput {
  raqId: string;
  aprovado: boolean;
  resultado: ResultadoAnalise;
}

export function useRAQsByPosto(postoId?: string) {
  return useQuery({
    queryKey: ['raq', postoId],
    queryFn: () => apiClient.get<RAQ[]>(`/api/raq?postoId=${postoId}`),
    enabled: !!postoId,
  });
}

export function useCreateRAQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRAQInput) => apiClient.post<CreateRAQOutput>('/api/raq', input),
    onSuccess: (output) => {
      queryClient.invalidateQueries({ queryKey: ['raq'] });
      toast.success(`RAQ registrado com resultado ${output.resultado}.`);
    },
  });
}
