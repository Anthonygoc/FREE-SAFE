import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { AuditAcao, AuditLog, AuditRecurso } from '@/domain/entities/audit-log.entity';
import type { AuditLogRepository } from '@/domain/ports/audit-log.repository';

const LIMITE_POR_PAGINA = 50;

export interface ListAuditoriaInput {
  usuario: UsuarioAutenticado;
  postoId?: string;
  usuarioId?: string;
  recurso?: AuditRecurso;
  acao?: AuditAcao;
  dataInicio?: Date;
  dataFim?: Date;
  pagina?: number;
}

export interface ListAuditoriaOutput {
  itens: AuditLog[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export class ListAuditoriaUseCase {
  constructor(private readonly auditLogRepo: AuditLogRepository) {}

  async execute(input: ListAuditoriaInput): Promise<ListAuditoriaOutput> {
    autorizar(input.usuario, 'auditorias', 'ver');

    const pagina = input.pagina && input.pagina > 0 ? Math.floor(input.pagina) : 1;
    const offset = (pagina - 1) * LIMITE_POR_PAGINA;

    const { itens, total } = await this.auditLogRepo.listar({
      postoId: input.postoId,
      usuarioId: input.usuarioId,
      recurso: input.recurso,
      acao: input.acao,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
      limite: LIMITE_POR_PAGINA,
      offset,
    });

    return {
      itens,
      total,
      pagina,
      totalPaginas: Math.max(1, Math.ceil(total / LIMITE_POR_PAGINA)),
    };
  }
}
