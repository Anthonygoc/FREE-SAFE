'use client';

import { useQuery } from '@tanstack/react-query';

import type { AuditAcao, AuditRecurso } from '@/domain/entities/audit-log.entity';
import { apiClient } from '@/lib/api-client';
import type { UsuarioResumo } from './use-usuarios';

export interface CalendarioMesTipo {
  tipo: AuditRecurso;
  quantidade: number;
}

export interface CalendarioMesDia {
  data: string;
  totalEventos: number;
  tipos: CalendarioMesTipo[];
  documentosVencendo: number;
}

export interface CalendarioMesResponse {
  dias: CalendarioMesDia[];
}

export interface ResumoDiaEvento {
  id: string;
  hora: string;
  usuarioNome: string;
  acao: AuditAcao;
  recurso: AuditRecurso;
  descricao: string;
  entidadeId?: string | null;
}

export interface ResumoDiaDocumento {
  id: string;
  titulo: string;
  categoriaNome: string;
}

export interface ResumoDiaResponse {
  eventos: ResumoDiaEvento[];
  documentosVencendo: ResumoDiaDocumento[];
}

export interface UseResumoDiaFiltros {
  usuarioId?: string;
  recurso?: AuditRecurso;
  acao?: AuditAcao;
}

export function useCalendarioMes(
  postoId: string | undefined,
  ano: number,
  mes: number,
) {
  return useQuery({
    queryKey: ['calendario', postoId, ano, mes],
    queryFn: () => {
      const params = new URLSearchParams({
        ano: String(ano),
        mes: String(mes),
      });

      if (postoId) {
        params.set('postoId', postoId);
      }

      return apiClient.get<CalendarioMesResponse>(`/api/calendario?${params.toString()}`);
    },
    enabled: Number.isInteger(ano) && Number.isInteger(mes) && mes >= 1 && mes <= 12,
  });
}

export function useResumoDia(
  postoId: string | undefined,
  data: string,
  filtros: UseResumoDiaFiltros,
  enabled = true,
) {
  return useQuery({
    queryKey: ['calendario', 'dia', postoId, data, filtros.usuarioId, filtros.recurso, filtros.acao],
    queryFn: () => {
      const params = new URLSearchParams({ data });

      if (postoId) {
        params.set('postoId', postoId);
      }

      if (filtros.usuarioId) {
        params.set('usuarioId', filtros.usuarioId);
      }

      if (filtros.recurso) {
        params.set('recurso', filtros.recurso);
      }

      if (filtros.acao) {
        params.set('acao', filtros.acao);
      }

      return apiClient.get<ResumoDiaResponse>(`/api/calendario/dia?${params.toString()}`);
    },
    enabled: enabled && /^\d{4}-\d{2}-\d{2}$/.test(data),
  });
}

export function useUsuariosCalendario(
  postoId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['calendario', 'usuarios', postoId],
    queryFn: () => {
      const params = new URLSearchParams();

      if (postoId) {
        params.set('postoId', postoId);
      }

      const path = params.toString()
        ? `/api/calendario/usuarios?${params.toString()}`
        : '/api/calendario/usuarios';

      return apiClient.get<UsuarioResumo[]>(path);
    },
    enabled: enabled && Boolean(postoId),
  });
}
