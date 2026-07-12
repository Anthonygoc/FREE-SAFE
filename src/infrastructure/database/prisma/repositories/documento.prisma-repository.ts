import type { Prisma, PrismaClient } from '@prisma/client';

import type {
  Documento,
  DocumentoComCategoria,
  DocumentoRepository,
  ListarDocumentosPorIntervaloVencimentoInput,
} from '@/domain/ports/documento.repository';
import { prisma } from '@/lib/prisma';

type DocumentoWithCategoria = Prisma.DocumentoGetPayload<{
  include: { categoria: true; posto: true };
}>;

type DocumentoRow = {
  id: string;
  postoId: string;
  categoriaId: string;
  titulo: string;
  numero: string | null;
  dataEmissao: Date | null;
  dataVencimento: Date | null;
  arquivoUrl: string | null;
  status: Documento['status'];
  criadoEm: Date;
  atualizadoEm: Date;
};

function mapDocumento(raw: DocumentoRow): Documento {
  return {
    id: raw.id,
    postoId: raw.postoId,
    categoriaId: raw.categoriaId,
    titulo: raw.titulo,
    status: raw.status,
    criadoEm: raw.criadoEm,
    atualizadoEm: raw.atualizadoEm,
    numero: raw.numero ?? undefined,
    dataEmissao: raw.dataEmissao ?? undefined,
    dataVencimento: raw.dataVencimento ?? undefined,
    arquivoUrl: raw.arquivoUrl ?? undefined,
  };
}

function mapDocumentoComCategoria(raw: DocumentoWithCategoria): DocumentoComCategoria {
  return {
    id: raw.id,
    postoId: raw.postoId,
    categoriaId: raw.categoriaId,
    categoriaNome: raw.categoria.nome,
    postoNome: raw.posto.nome,
    titulo: raw.titulo,
    status: raw.status,
    criadoEm: raw.criadoEm,
    atualizadoEm: raw.atualizadoEm,
    numero: raw.numero ?? undefined,
    dataEmissao: raw.dataEmissao ?? undefined,
    dataVencimento: raw.dataVencimento ?? undefined,
    arquivoUrl: raw.arquivoUrl ?? undefined,
  };
}

export class DocumentoPrismaRepository implements DocumentoRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listarPorPosto(postoId: string): Promise<DocumentoComCategoria[]> {
    const rows = await this.db.documento.findMany({
      where: { postoId },
      include: { categoria: true, posto: true },
      orderBy: { dataVencimento: 'asc' },
    });

    return rows.map(mapDocumentoComCategoria);
  }

  async listarVencendoEm(dias: number): Promise<DocumentoComCategoria[]> {
    const hoje = new Date();
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + dias);

    const rows = await this.db.documento.findMany({
      where: {
        dataVencimento: { not: null, lte: limite },
      },
      include: { categoria: true, posto: true },
      orderBy: { dataVencimento: 'asc' },
    });

    return rows.map(mapDocumentoComCategoria);
  }

  async listarPorIntervaloVencimento(
    input: ListarDocumentosPorIntervaloVencimentoInput,
  ): Promise<DocumentoComCategoria[]> {
    const rows = await this.db.documento.findMany({
      where: {
        ...(input.postoId ? { postoId: input.postoId } : {}),
        dataVencimento: {
          not: null,
          gte: input.inicio,
          lte: input.fim,
        },
      },
      include: { categoria: true, posto: true },
      orderBy: { dataVencimento: 'asc' },
    });

    return rows.map(mapDocumentoComCategoria);
  }

  async salvar(documento: Documento): Promise<void> {
    await this.db.documento.upsert({
      where: { id: documento.id },
      create: {
        id: documento.id,
        postoId: documento.postoId,
        categoriaId: documento.categoriaId,
        titulo: documento.titulo,
        numero: documento.numero ?? null,
        dataEmissao: documento.dataEmissao ?? null,
        dataVencimento: documento.dataVencimento ?? null,
        arquivoUrl: documento.arquivoUrl ?? null,
        status: documento.status,
        criadoEm: documento.criadoEm,
        atualizadoEm: documento.atualizadoEm,
      },
      update: {
        categoriaId: documento.categoriaId,
        titulo: documento.titulo,
        numero: documento.numero ?? null,
        dataEmissao: documento.dataEmissao ?? null,
        dataVencimento: documento.dataVencimento ?? null,
        arquivoUrl: documento.arquivoUrl ?? null,
        status: documento.status,
        atualizadoEm: documento.atualizadoEm,
      },
    });
  }

  async buscarPorId(id: string): Promise<Documento | null> {
    const raw = await this.db.documento.findUnique({ where: { id } });
    if (!raw) return null;

    return mapDocumento(raw);
  }

  async deletar(id: string): Promise<void> {
    await this.db.documento.delete({ where: { id } });
  }
}
