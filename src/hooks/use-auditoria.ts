'use client';

import { useQuery } from '@tanstack/react-query';

import type { AuditAcao, AuditRecurso } from '@/domain/entities/audit-log.entity';
import { apiClient } from '@/lib/api-client';

export interface AuditoriaFiltros {
  postoId?: string;
  usuarioId?: string;
  recurso?: AuditRecurso;
  acao?: AuditAcao;
  dataInicio?: string;
  dataFim?: string;
  pagina?: number;
}

export interface AuditoriaItem {
  id: string;
  usuarioId?: string | null;
  usuarioNome: string;
  usuarioEmail: string;
  perfil: string;
  acao: AuditAcao;
  recurso: AuditRecurso;
  entidadeId?: string | null;
  postoId?: string | null;
  descricao: string;
  detalhes?: string | null;
  ip?: string | null;
  criadoEm: string;
}

export interface AuditoriaResponse {
  itens: AuditoriaItem[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

function normalizarFiltros(filtros: AuditoriaFiltros): AuditoriaFiltros {
  return {
    postoId: filtros.postoId || undefined,
    usuarioId: filtros.usuarioId || undefined,
    recurso: filtros.recurso || undefined,
    acao: filtros.acao || undefined,
    dataInicio: filtros.dataInicio || undefined,
    dataFim: filtros.dataFim || undefined,
    pagina: filtros.pagina && filtros.pagina > 1 ? filtros.pagina : undefined,
  };
}

function montarQueryString(filtros: AuditoriaFiltros): string {
  const params = new URLSearchParams();

  if (filtros.postoId) {
    params.set('postoId', filtros.postoId);
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

  if (filtros.dataInicio) {
    params.set('dataInicio', filtros.dataInicio);
  }

  if (filtros.dataFim) {
    params.set('dataFim', filtros.dataFim);
  }

  if (filtros.pagina && filtros.pagina > 1) {
    params.set('pagina', String(filtros.pagina));
  }

  return params.toString();
}

export function useAuditoria(filtros: AuditoriaFiltros, enabled = true) {
  const filtrosNormalizados = normalizarFiltros(filtros);

  return useQuery({
    queryKey: ['auditoria', filtrosNormalizados],
    queryFn: () => {
      const queryString = montarQueryString(filtrosNormalizados);
      const path = queryString ? `/api/auditoria?${queryString}` : '/api/auditoria';

      return apiClient.get<AuditoriaResponse>(path);
    },
    enabled,
  });
}
