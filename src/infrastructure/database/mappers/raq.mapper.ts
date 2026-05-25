import type { Prisma, RAQ as PrismaRAQ } from '@prisma/client';

import { RAQ } from '@/domain/entities/raq.entity';

export class RAQMapper {
  static toDomain(raw: PrismaRAQ): RAQ {
    return RAQ.reconstituir({
      id: raw.id,
      postoId: raw.postoId,
      responsavelId: raw.responsavelId,
      produto: raw.produto,
      temperaturaObservada: raw.temperaturaObservada,
      densidadeObservada: raw.densidadeObservada,
      aspecto: raw.aspecto,
      cor: raw.cor as 'CARACTERISTICA' | 'ALTERADA',
      faseAquosa: raw.faseAquosa ?? undefined,
      teorAlcoolico: raw.teorAlcoolico ?? undefined,
      distribuidora: raw.distribuidora ?? undefined,
      notaFiscal: raw.notaFiscal ?? undefined,
      placaCaminhao: raw.placaCaminhao ?? undefined,
      tanqueDestino: raw.tanqueDestino ?? undefined,
      resultado: raw.resultado,
      boletimUrl: raw.boletimUrl ?? undefined,
      fotoProvetaUrl: raw.fotoProvetaUrl ?? undefined,
      criadoEm: raw.criadoEm,
    });
  }

  static toPrisma(raq: RAQ): Prisma.RAQCreateInput {
    return {
      id: raq.id,
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
      criadoEm: raq.criadoEm,
    };
  }
}
