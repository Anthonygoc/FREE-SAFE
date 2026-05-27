import type { PrismaClient } from '@prisma/client';

import type { ColaboradorRepository, ListarColaboradoresFiltros } from '@/domain/ports/colaborador.repository';
import type { Colaborador } from '@/domain/entities/colaborador.entity';
import { ColaboradorMapper } from '@/infrastructure/database/mappers/colaborador.mapper';
import { prisma } from '@/lib/prisma';

export class ColaboradorPrismaRepository implements ColaboradorRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listarPorPosto(postoId: string, filtros?: ListarColaboradoresFiltros): Promise<Colaborador[]> {
    const registros = await this.db.colaborador.findMany({
      where: {
        postoId,
        ...(filtros?.cargo ? { cargo: filtros.cargo } : {}),
        ...(filtros?.status ? { status: filtros.status } : {}),
      },
      orderBy: { nome: 'asc' },
    });

    return registros.map(ColaboradorMapper.toDomain);
  }

  async buscarPorId(id: string): Promise<Colaborador | null> {
    const raw = await this.db.colaborador.findUnique({ where: { id } });
    return raw ? ColaboradorMapper.toDomain(raw) : null;
  }

  async buscarPorUserId(userId: string): Promise<Colaborador | null> {
    const raw = await this.db.colaborador.findFirst({ where: { userId } });
    return raw ? ColaboradorMapper.toDomain(raw) : null;
  }

  async salvar(colaborador: Colaborador): Promise<void> {
    await this.db.colaborador.upsert({
      where: { id: colaborador.id },
      create: ColaboradorMapper.toPrismaCreate(colaborador),
      update: ColaboradorMapper.toPrismaUpdate(colaborador),
    });
  }

  async contarAtivos(): Promise<number> {
    return this.db.colaborador.count({ where: { status: 'ATIVO' } });
  }
}
