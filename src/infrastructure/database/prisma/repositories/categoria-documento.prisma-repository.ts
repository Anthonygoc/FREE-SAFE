import type { PrismaClient } from '@prisma/client';

import type { CategoriaDocumento, CategoriaDocumentoRepository } from '@/domain/ports/categoria-documento.repository';
import { prisma } from '@/lib/prisma';

type CategoriaDocumentoRow = {
  id: string;
  nome: string;
  descricao: string | null;
  criadoEm: Date;
};

function mapCategoriaDocumento(raw: CategoriaDocumentoRow): CategoriaDocumento {
  return {
    id: raw.id,
    nome: raw.nome,
    descricao: raw.descricao ?? undefined,
    criadoEm: raw.criadoEm,
  };
}

export class CategoriaDocumentoPrismaRepository implements CategoriaDocumentoRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listarTodas(): Promise<CategoriaDocumento[]> {
    const rows = await this.db.categoriaDocumento.findMany({
      orderBy: { nome: 'asc' },
    });

    return rows.map(mapCategoriaDocumento);
  }

  async buscarPorNome(nome: string): Promise<CategoriaDocumento | null> {
    const row = await this.db.categoriaDocumento.findFirst({
      where: {
        nome: {
          equals: nome,
          mode: 'insensitive',
        },
      },
    });

    return row ? mapCategoriaDocumento(row) : null;
  }

  async buscarPorId(id: string): Promise<CategoriaDocumento | null> {
    const row = await this.db.categoriaDocumento.findUnique({
      where: { id },
    });

    return row ? mapCategoriaDocumento(row) : null;
  }

  async salvar(categoria: CategoriaDocumento): Promise<void> {
    await this.db.categoriaDocumento.upsert({
      where: { nome: categoria.nome },
      create: {
        id: categoria.id,
        nome: categoria.nome,
        descricao: categoria.descricao ?? null,
        criadoEm: categoria.criadoEm,
      },
      update: {
        descricao: categoria.descricao ?? null,
      },
    });
  }
}
