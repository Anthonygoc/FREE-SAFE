import { formatInTimeZone } from 'date-fns-tz';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { AuditAcao, AuditRecurso } from '@/domain/entities/audit-log.entity';
import type { AuditLogRepository } from '@/domain/ports/audit-log.repository';
import type { DocumentoRepository } from '@/domain/ports/documento.repository';
import {
  calcularIntervaloAuditLogDoDia,
  calcularIntervaloDocumentosDoDia,
  resolverPostoId,
  TIME_ZONE,
} from './calendario.shared';

export interface ListarResumoDiaInput {
  usuario: UsuarioAutenticado;
  postoId?: string;
  data: string;
  usuarioId?: string;
  recurso?: AuditRecurso;
  acao?: AuditAcao;
}

export interface ListarResumoDiaEventoOutput {
  id: string;
  hora: string;
  usuarioNome: string;
  acao: AuditAcao;
  recurso: AuditRecurso;
  descricao: string;
  entidadeId?: string | null;
}

export interface ListarResumoDiaDocumentoOutput {
  id: string;
  titulo: string;
  categoriaNome: string;
}

export interface ListarResumoDiaOutput {
  eventos: ListarResumoDiaEventoOutput[];
  documentosVencendo: ListarResumoDiaDocumentoOutput[];
}

export class ListarResumoDiaUseCase {
  constructor(
    private readonly auditLogRepo: AuditLogRepository,
    private readonly documentoRepo: DocumentoRepository,
  ) {}

  async execute(input: ListarResumoDiaInput): Promise<ListarResumoDiaOutput> {
    const postoId = resolverPostoId(input.usuario, input.postoId);
    autorizar(input.usuario, 'calendario', 'ver', postoId);

    const intervaloAuditLog = calcularIntervaloAuditLogDoDia(input.data);
    const intervaloDocumentos = calcularIntervaloDocumentosDoDia(input.data);

    const [logs, documentos] = await Promise.all([
      this.auditLogRepo.listarPorIntervalo({
        postoId,
        inicio: intervaloAuditLog.inicio,
        fim: intervaloAuditLog.fim,
      }),
      this.documentoRepo.listarPorIntervaloVencimento({
        postoId,
        inicio: intervaloDocumentos.inicio,
        fim: intervaloDocumentos.fim,
      }),
    ]);

    const eventos = logs
      .filter((log) => {
        if (input.usuarioId && log.usuarioId !== input.usuarioId) {
          return false;
        }

        if (input.recurso && log.recurso !== input.recurso) {
          return false;
        }

        if (input.acao && log.acao !== input.acao) {
          return false;
        }

        return true;
      })
      .map((log) => ({
        id: log.id,
        hora: formatInTimeZone(log.criadoEm, TIME_ZONE, 'HH:mm'),
        usuarioNome: log.usuarioNome,
        acao: log.acao,
        recurso: log.recurso,
        descricao: log.descricao,
        entidadeId: log.entidadeId,
      }));

    return {
      eventos,
      documentosVencendo: documentos
        .filter((documento) => Boolean(documento.dataVencimento))
        .map((documento) => ({
          id: documento.id,
          titulo: documento.titulo,
          categoriaNome: documento.categoriaNome,
        })),
    };
  }
}
