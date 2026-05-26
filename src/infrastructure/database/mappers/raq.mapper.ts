import type { Prisma, RAQ as PrismaRAQ } from '@prisma/client';

import { RAQ } from '@/domain/entities/raq.entity';

export class RAQMapper {
  static toDomain(raw: PrismaRAQ): RAQ {
    return RAQ.reconstituir({
      id: raw.id,
      postoId: raw.postoId,
      responsavelId: raw.responsavelId,
      produto: raw.produto,
      volumeRecebido: raw.volumeRecebido ?? undefined,
      temperaturaObservada: raw.temperaturaObservada,
      densidadeObservada: raw.densidadeObservada,
      massa20c: raw.massa20c ?? undefined,
      aspecto: raw.aspecto,
      cor: raw.cor as 'CARACTERISTICA' | 'ALTERADA',
      faseAquosa: raw.faseAquosa ?? undefined,
      teorEtanol: raw.teorEtanol ?? undefined,
      teorAlcoolico: raw.teorAlcoolico ?? undefined,
      distribuidora: raw.distribuidora ?? undefined,
      cnpjDistribuidora: raw.cnpjDistribuidora ?? undefined,
      transportador: raw.transportador ?? undefined,
      cnpjTransportador: raw.cnpjTransportador ?? undefined,
      notaFiscal: raw.notaFiscal ?? undefined,
      placaCaminhao: raw.placaCaminhao ?? undefined,
      nomeMotorista: raw.nomeMotorista ?? undefined,
      cpfMotorista: raw.cpfMotorista ?? undefined,
      tanqueDestino: raw.tanqueDestino ?? undefined,
      nomeAnalista: raw.nomeAnalista ?? undefined,
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
      volumeRecebido: raq.volumeRecebido ?? null,
      temperaturaObservada: raq.temperaturaObservada,
      densidadeObservada: raq.densidadeObservada,
      massa20c: raq.massa20c ?? null,
      aspecto: raq.aspecto,
      cor: raq.cor,
      faseAquosa: raq.faseAquosa ?? null,
      teorEtanol: raq.teorEtanol ?? null,
      teorAlcoolico: raq.teorAlcoolico ?? null,
      resultado: raq.resultado,
      boletimUrl: raq.boletimUrl ?? null,
      fotoProvetaUrl: raq.fotoProvetaUrl ?? null,
      distribuidora: raq.distribuidora ?? null,
      cnpjDistribuidora: raq.cnpjDistribuidora ?? null,
      transportador: raq.transportador ?? null,
      cnpjTransportador: raq.cnpjTransportador ?? null,
      notaFiscal: raq.notaFiscal ?? null,
      placaCaminhao: raq.placaCaminhao ?? null,
      nomeMotorista: raq.nomeMotorista ?? null,
      cpfMotorista: raq.cpfMotorista ?? null,
      tanqueDestino: raq.tanqueDestino ?? null,
      nomeAnalista: raq.nomeAnalista ?? null,
      criadoEm: raq.criadoEm,
    };
  }
}
