import type { PrismaClient } from '@prisma/client';

import type { Afericao } from '@/domain/entities/afericao.entity';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';
import { AfericaoMapper } from '@/infrastructure/database/mappers/afericao.mapper';
import { prisma } from '@/lib/prisma';

export class AfericaoPrismaRepository implements AfericaoRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async salvar(afericao: Afericao): Promise<void> {
    await this.db.afericao.upsert({
      where: { id: afericao.id },
      create: AfericaoMapper.toPrismaCreate(afericao),
      update: AfericaoMapper.toPrismaUpdate(afericao),
    });
  }

  async buscarPorId(id: string): Promise<Afericao | null> {
    const raw = await this.db.afericao.findUnique({ where: { id } });
    return raw ? AfericaoMapper.toDomain(raw) : null;
  }

  async listarPorPosto(postoId: string): Promise<Afericao[]> {
    const raws = await this.db.afericao.findMany({
      where: { postoId },
      orderBy: { criadoEm: 'desc' },
    });

    return raws.map(AfericaoMapper.toDomain);
  }

  async listarPorBomba(postoId: string, bomba: number): Promise<Afericao[]> {
    const raws = await this.db.afericao.findMany({
      where: { postoId, bomba },
      orderBy: { criadoEm: 'desc' },
    });

    return raws.map(AfericaoMapper.toDomain);
  }
}
