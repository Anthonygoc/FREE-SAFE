import type { PrismaClient } from '@prisma/client';

import type {
  AtualizarBombaData,
  Bico,
  Bomba,
  BombaComBicos,
  BombaRepository,
} from '@/domain/ports/bomba.repository';
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

function mapBomba(raw: {
  id: string;
  postoId: string;
  numero: number;
  modelo: string | null;
  ativo: boolean;
  criadoEm: Date;
}): Bomba {
  return {
    id: raw.id,
    postoId: raw.postoId,
    numero: raw.numero,
    modelo: raw.modelo ?? undefined,
    ativo: raw.ativo,
    criadoEm: raw.criadoEm,
  };
}

export class BombaPrismaRepository implements BombaRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listarPorPosto(postoId: string): Promise<BombaComBicos[]> {
    const rows = await this.db.bomba.findMany({
      where: { postoId, ativo: true },
      include: {
        bicos: {
          where: { ativo: true },
          orderBy: { numero: 'asc' },
        },
      },
      orderBy: { numero: 'asc' },
    });

    return rows.map((row) => ({
      ...mapBomba(row),
      bicos: row.bicos.map(mapBico),
    }));
  }

  async buscarPorId(id: string): Promise<Bomba | null> {
    const raw = await this.db.bomba.findFirst({
      where: { id, ativo: true },
    });

    if (!raw) {
      return null;
    }

    return mapBomba(raw);
  }

  async buscarInativaPorNumero(postoId: string, numero: number): Promise<Bomba | null> {
    const raw = await this.db.bomba.findFirst({
      where: { postoId, numero, ativo: false },
    });

    if (!raw) {
      return null;
    }

    return mapBomba(raw);
  }

  async contarAfericoes(bombaId: string): Promise<number> {
    const bicos = await this.db.bico.findMany({
      where: { bombaId },
      select: { id: true },
    });

    return this.db.afericao.count({
      where: {
        bicoId: { in: bicos.map((bico) => bico.id) },
      },
    });
  }

  async salvar(bomba: Bomba): Promise<void> {
    await this.db.bomba.upsert({
      where: { id: bomba.id },
      create: {
        id: bomba.id,
        posto: { connect: { id: bomba.postoId } },
        numero: bomba.numero,
        modelo: bomba.modelo ?? null,
        ativo: bomba.ativo,
        criadoEm: bomba.criadoEm,
      },
      update: {
        posto: { connect: { id: bomba.postoId } },
        numero: bomba.numero,
        modelo: bomba.modelo ?? null,
        ativo: bomba.ativo,
      },
    });
  }

  async deletar(id: string): Promise<void> {
    await this.db.bomba.delete({
      where: { id },
    });
  }

  async excluirDefinitivo(bombaId: string): Promise<void> {
    await this.db.$transaction([
      this.db.bico.deleteMany({
        where: { bombaId },
      }),
      this.db.bomba.delete({
        where: { id: bombaId },
      }),
    ]);
  }

  async reativar(bombaId: string): Promise<void> {
    await this.db.bomba.update({
      where: { id: bombaId },
      data: { ativo: true },
    });
  }

  async atualizar(id: string, dados: AtualizarBombaData): Promise<void> {
    const data: {
      numero?: number;
      modelo?: string | null;
      ativo?: boolean;
    } = {};

    if (dados.numero !== undefined) {
      data.numero = dados.numero;
    }

    if (dados.modelo !== undefined) {
      data.modelo = dados.modelo;
    }

    if (dados.ativo !== undefined) {
      data.ativo = dados.ativo;
    }

    await this.db.bomba.update({
      where: { id },
      data,
    });
  }
}
