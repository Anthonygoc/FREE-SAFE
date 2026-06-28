import type { AuditLog } from '@/domain/entities/audit-log.entity';

export interface RegistrarAuditoriaInput {
  usuarioId?: string | null;
  usuarioNome: string;
  usuarioEmail: string;
  perfil: string;
  acao: AuditLog['acao'];
  recurso: AuditLog['recurso'];
  entidadeId?: string | null;
  postoId?: string | null;
  descricao: string;
  detalhes?: string | null;
  ip?: string | null;
}

export interface ListarAuditoriaFiltro {
  postoId?: string;
  usuarioId?: string;
  recurso?: AuditLog['recurso'];
  acao?: AuditLog['acao'];
  dataInicio?: Date;
  dataFim?: Date;
  limite?: number;
  offset?: number;
}

export interface AuditLogRepository {
  registrar(input: RegistrarAuditoriaInput): Promise<void>;
  listar(filtro: ListarAuditoriaFiltro): Promise<{ itens: AuditLog[]; total: number }>;
}
