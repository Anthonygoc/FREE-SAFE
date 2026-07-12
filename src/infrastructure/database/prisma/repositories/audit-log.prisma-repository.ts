import type { Prisma, PrismaClient } from '@prisma/client';

import type { AuditLog } from '@/domain/entities/audit-log.entity';
import type {
  AuditLogRepository,
  ListarAuditLogPorIntervaloInput,
  ListarAuditoriaFiltro,
  RegistrarAuditoriaInput,
} from '@/domain/ports/audit-log.repository';
import { prisma } from '@/lib/prisma';

type AuditLogRow = {
  id: string;
  usuarioId: string | null;
  usuarioNome: string;
  usuarioEmail: string;
  perfil: string;
  acao: AuditLog['acao'];
  recurso: AuditLog['recurso'];
  entidadeId: string | null;
  postoId: string | null;
  descricao: string;
  detalhes: string | null;
  ip: string | null;
  criadoEm: Date;
};

function mapAuditLog(raw: AuditLogRow): AuditLog {
  return {
    id: raw.id,
    usuarioNome: raw.usuarioNome,
    usuarioEmail: raw.usuarioEmail,
    perfil: raw.perfil,
    acao: raw.acao,
    recurso: raw.recurso,
    descricao: raw.descricao,
    criadoEm: raw.criadoEm,
    usuarioId: raw.usuarioId,
    entidadeId: raw.entidadeId,
    postoId: raw.postoId,
    detalhes: raw.detalhes,
    ip: raw.ip,
  };
}

export class AuditLogPrismaRepository implements AuditLogRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async registrar(input: RegistrarAuditoriaInput): Promise<void> {
    await this.db.auditLog.create({
      data: {
        usuarioId: input.usuarioId ?? null,
        usuarioNome: input.usuarioNome,
        usuarioEmail: input.usuarioEmail,
        perfil: input.perfil,
        acao: input.acao,
        recurso: input.recurso as Prisma.AuditLogCreateInput['recurso'],
        entidadeId: input.entidadeId ?? null,
        postoId: input.postoId ?? null,
        descricao: input.descricao,
        detalhes: input.detalhes ?? null,
        ip: input.ip ?? null,
      },
    });
  }

  async listar(filtro: ListarAuditoriaFiltro): Promise<{ itens: AuditLog[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = {
      ...(filtro.postoId ? { postoId: filtro.postoId } : {}),
      ...(filtro.usuarioId ? { usuarioId: filtro.usuarioId } : {}),
      ...(filtro.recurso ? { recurso: filtro.recurso as Prisma.AuditLogWhereInput['recurso'] } : {}),
      ...(filtro.acao ? { acao: filtro.acao } : {}),
      ...((filtro.dataInicio || filtro.dataFim)
        ? {
            criadoEm: {
              ...(filtro.dataInicio ? { gte: filtro.dataInicio } : {}),
              ...(filtro.dataFim ? { lte: filtro.dataFim } : {}),
            },
          }
        : {}),
    };

    const limite = filtro.limite ?? 50;
    const offset = filtro.offset ?? 0;

    const [rows, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        take: limite,
        skip: offset,
      }),
      this.db.auditLog.count({ where }),
    ]);

    return {
      itens: rows.map(mapAuditLog),
      total,
    };
  }

  async listarPorIntervalo(input: ListarAuditLogPorIntervaloInput): Promise<AuditLog[]> {
    const rows = await this.db.auditLog.findMany({
      where: {
        ...(input.postoId ? { postoId: input.postoId } : { postoId: { not: null } }),
        criadoEm: {
          gte: input.inicio,
          lte: input.fim,
        },
      },
      orderBy: { criadoEm: 'asc' },
    });

    return rows.map(mapAuditLog);
  }
}
