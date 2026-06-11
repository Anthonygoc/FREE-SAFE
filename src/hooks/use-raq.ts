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
  volumeRecebido?: number;
  temperaturaObservada: number;
  densidadeObservada: number;
  massa20c?: number;
  aspecto: 'LIQUIDO_E_ISENTO' | 'TURVO' | 'COM_IMPUREZAS';
  cor: 'CARACTERISTICA' | 'ALTERADA';
  faseAquosa?: number;
  teorEtanol?: number;
  teorAlcoolico?: number;
  distribuidora?: string;
  cnpjDistribuidora?: string;
  transportador?: string;
  cnpjTransportador?: string;
  notaFiscal?: string;
  placaCaminhao?: string;
  nomeMotorista?: string;
  cpfMotorista?: string;
  tanqueDestino?: string;
  nomeAnalista?: string;
  resultado: ResultadoAnalise;
  criadoEm: string;
}

export interface CreateRAQInput {
  postoId: string;
  produto: ProdutoCombustivel;
  volumeRecebido?: number;
  temperaturaObservada: number;
  densidadeObservada: number;
  massa20c?: number;
  aspecto: 'LIQUIDO_E_ISENTO' | 'TURVO' | 'COM_IMPUREZAS';
  cor: 'CARACTERISTICA' | 'ALTERADA';
  faseAquosa?: number;
  teorEtanol?: number;
  teorAlcoolico?: number;
  distribuidora?: string;
  cnpjDistribuidora?: string;
  transportador?: string;
  cnpjTransportador?: string;
  notaFiscal?: string;
  placaCaminhao?: string;
  nomeMotorista?: string;
  cpfMotorista?: string;
  tanqueDestino?: string;
  nomeAnalista?: string;
}

export interface CreateRAQOutput {
  raqId: string;
  aprovado: boolean;
  resultado: ResultadoAnalise;
}

export interface RAQFiltros {
  dataInicio?: string;
  dataFim?: string;
  produto?: ProdutoCombustivel;
  resultado?: ResultadoAnalise;
}

export function useRAQsByPosto(postoId?: string, filtros?: RAQFiltros) {
  const filtrosNormalizados = {
    dataInicio: filtros?.dataInicio ?? '',
    dataFim: filtros?.dataFim ?? '',
    produto: filtros?.produto ?? '',
    resultado: filtros?.resultado ?? '',
  };

  return useQuery({
    queryKey: ['raq', postoId, filtrosNormalizados],
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (postoId) {
        searchParams.set('postoId', postoId);
      }

      if (filtrosNormalizados.dataInicio) {
        searchParams.set('dataInicio', new Date(`${filtrosNormalizados.dataInicio}T00:00:00`).toISOString());
      }

      if (filtrosNormalizados.dataFim) {
        searchParams.set('dataFim', new Date(`${filtrosNormalizados.dataFim}T23:59:59`).toISOString());
      }

      if (filtrosNormalizados.produto) {
        searchParams.set('produto', filtrosNormalizados.produto);
      }

      if (filtrosNormalizados.resultado) {
        searchParams.set('resultado', filtrosNormalizados.resultado);
      }

      return apiClient.get<RAQ[]>(`/api/raq?${searchParams.toString()}`);
    },
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
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar RAQ.');
    },
  });
}
