import type { PrismaClient } from '@prisma/client';

import type { BicoRepository } from '@/domain/ports/bico.repository';
import type { Bico } from '@/domain/ports/bomba.repository';
import { prisma } from '@/lib/prisma';

function mapBico(raw: {
  id: string;
  bombaId: string;
  numero: number;
  produto: Bico['produto'];
  capacidade: number | null;
  ativo: boolean;
  criadoEm: Date;
}): Bico {
  return {
    id: raw.id,
    bombaId: raw.bombaId,
    numero: raw.numero,
    produto: raw.produto,
    capacidade: raw.capacidade ?? undefined,
    ativo: raw.ativo,
    criadoEm: raw.criadoEm,
  };
}

export class BicoPrismaRepository implements BicoRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listarPorBomba(bombaId: string, incluirInativos = false): Promise<Bico[]> {
    const rows = await this.db.bico.findMany({
      where: incluirInativos ? { bombaId } : { bombaId, ativo: true },
      orderBy: { numero: 'asc' },
    });

    return rows.map(mapBico);
  }

  async buscarPorId(id: string): Promise<Bico | null> {
    const raw = await this.db.bico.findFirst({
      where: { id, ativo: true },
    });

    if (!raw) {
      return null;
    }

    return mapBico(raw);
  }

  async salvar(bico: Bico): Promise<void> {
    await this.db.bico.upsert({
      where: { id: bico.id },
      create: {
        id: bico.id,
        bomba: { connect: { id: bico.bombaId } },
        numero: bico.numero,
        produto: bico.produto,
        capacidade: bico.capacidade ?? null,
        ativo: bico.ativo,
        criadoEm: bico.criadoEm,
      },
      update: {
        bomba: { connect: { id: bico.bombaId } },
        numero: bico.numero,
        produto: bico.produto,
        capacidade: bico.capacidade ?? null,
        ativo: bico.ativo,
      },
    });
  }

  async deletar(id: string): Promise<void> {
    await this.db.bico.delete({
      where: { id },
    });
  }

  async desativar(id: string): Promise<void> {
    await this.db.bico.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async contarAfericoes(bicoId: string): Promise<number> {
    return this.db.afericao.count({
      where: { bicoId },
    });
  }
}
