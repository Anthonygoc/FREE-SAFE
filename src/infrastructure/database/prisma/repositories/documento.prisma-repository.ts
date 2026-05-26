import type { PrismaClient } from '@prisma/client';
import type { Documento, DocumentoRepository } from '@/domain/ports/documento.repository';
import { prisma } from '@/lib/prisma';

function mapDocumento(raw: any): Documento {
  return {
    id: raw.id,
    postoId: raw.postoId,
    tipo: raw.tipo,
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

  async listarPorPosto(postoId: string): Promise<Documento[]> {
    const rows = await this.db.documento.findMany({
      where: { postoId },
      orderBy: { dataVencimento: 'asc' },
    });
    return rows.map(mapDocumento);
  }

  async listarVencendoEm(dias: number): Promise<Documento[]> {
    const hoje = new Date();
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + dias);
    const rows = await this.db.documento.findMany({
      where: {
        dataVencimento: { not: null, lte: limite },
      },
      orderBy: { dataVencimento: 'asc' },
    });
    return rows.map(mapDocumento);
  }

  async salvar(documento: Documento): Promise<void> {
    await this.db.documento.upsert({
      where: { id: documento.id },
      create: {
        id: documento.id,
        postoId: documento.postoId,
        tipo: documento.tipo,
        numero: documento.numero ?? null,
        dataEmissao: documento.dataEmissao ?? null,
        dataVencimento: documento.dataVencimento ?? null,
        arquivoUrl: documento.arquivoUrl ?? null,
        status: documento.status,
        criadoEm: documento.criadoEm,
        atualizadoEm: documento.atualizadoEm,
      },
      update: {
        tipo: documento.tipo,
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
}
