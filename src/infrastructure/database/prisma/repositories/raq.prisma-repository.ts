import type { Prisma, PrismaClient } from '@prisma/client';

import type { RAQ } from '@/domain/entities/raq.entity';
import type { FiltrosRAQ, RAQRepository } from '@/domain/ports/raq.repository';
import { RAQMapper } from '@/infrastructure/database/mappers/raq.mapper';
import { prisma } from '@/lib/prisma';

export class RAQPrismaRepository implements RAQRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async salvar(raq: RAQ): Promise<void> {
    await this.db.rAQ.upsert({
      where: { id: raq.id },
      create: RAQMapper.toPrisma(raq),
      update: {
        posto: { connect: { id: raq.postoId } },
        responsavel: { connect: { id: raq.responsavelId } },
        produto: raq.produto,
        temperaturaObservada: raq.temperaturaObservada,
        densidadeObservada: raq.densidadeObservada,
        aspecto: raq.aspecto,
        cor: raq.cor,
        faseAquosa: raq.faseAquosa ?? null,
        teorAlcoolico: raq.teorAlcoolico ?? null,
        resultado: raq.resultado,
        boletimUrl: raq.boletimUrl ?? null,
        fotoProvetaUrl: raq.fotoProvetaUrl ?? null,
        distribuidora: raq.distribuidora ?? null,
        notaFiscal: raq.notaFiscal ?? null,
        placaCaminhao: raq.placaCaminhao ?? null,
        tanqueDestino: raq.tanqueDestino ?? null,
      },
    });
  }

  async buscarPorId(id: string): Promise<RAQ | null> {
    const raw = await this.db.rAQ.findUnique({ where: { id } });
    return raw ? RAQMapper.toDomain(raw) : null;
  }

  async listar(filtros: FiltrosRAQ): Promise<RAQ[]> {
    const where: Prisma.RAQWhereInput = {
      ...(filtros.postoId ? { postoId: filtros.postoId } : {}),
      ...(filtros.produto ? { produto: filtros.produto } : {}),
      ...(filtros.resultado ? { resultado: filtros.resultado } : {}),
      ...((filtros.dataInicio || filtros.dataFim)
        ? {
            data: {
              ...(filtros.dataInicio ? { gte: filtros.dataInicio } : {}),
              ...(filtros.dataFim ? { lte: filtros.dataFim } : {}),
            },
          }
        : {}),
    };

    const raws = await this.db.rAQ.findMany({
      where,
      orderBy: { data: 'desc' },
    });

    return raws.map(RAQMapper.toDomain);
  }

  async contarPorPosto(postoId: string): Promise<number> {
    return this.db.rAQ.count({ where: { postoId } });
  }

  async contarSemBoletim(): Promise<number> {
    return this.db.rAQ.count({
      where: {
        OR: [
          { boletimUrl: null },
          { boletimUrl: '' },
        ],
      },
    });
  }
}
