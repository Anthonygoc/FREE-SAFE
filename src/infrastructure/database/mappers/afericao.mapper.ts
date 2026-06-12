import type { Afericao as PrismaAfericao, Prisma } from '@prisma/client';

import { Afericao } from '@/domain/entities/afericao.entity';

type AfericaoRecord = Pick<
  PrismaAfericao,
  | 'id'
  | 'postoId'
  | 'responsavelId'
  | 'loteId'
  | 'bicoId'
  | 'produto'
  | 'bomba'
  | 'numeroBico'
  | 'medidaPadrao'
  | 'resultadoMl'
  | 'situacao'
  | 'observacoes'
  | 'fotoUrl'
  | 'criadoEm'
> & {
  responsavelNome?: string | null;
};

export class AfericaoMapper {
  static toDomain(raw: AfericaoRecord): Afericao {
    return Afericao.reconstituir({
      id: raw.id,
      postoId: raw.postoId,
      responsavelId: raw.responsavelId,
      responsavelNome: raw.responsavelNome ?? undefined,
      loteId: raw.loteId ?? undefined,
      bicoId: raw.bicoId ?? undefined,
      produto: raw.produto,
      bomba: raw.bomba,
      bico: raw.numeroBico,
      medidaPadrao: raw.medidaPadrao,
      resultadoMl: raw.resultadoMl,
      situacao: raw.situacao,
      observacoes: raw.observacoes ?? undefined,
      fotoUrl: raw.fotoUrl ?? undefined,
      criadoEm: raw.criadoEm,
    });
  }

  static toPrismaCreate(afericao: Afericao): Prisma.AfericaoCreateInput {
    return {
      id: afericao.id,
      posto: { connect: { id: afericao.postoId } },
      responsavelId: afericao.responsavelId,
      loteId: afericao.loteId ?? null,
      bico: afericao.bicoId ? { connect: { id: afericao.bicoId } } : undefined,
      produto: afericao.produto,
      bomba: afericao.bomba,
      numeroBico: afericao.bico,
      medidaPadrao: afericao.medidaPadrao,
      resultadoMl: afericao.resultadoMl,
      situacao: afericao.situacao,
      observacoes: afericao.observacoes ?? null,
      fotoUrl: afericao.fotoUrl ?? null,
      fotosUrls: [],
      relatorioUrl: null,
      criadoEm: afericao.criadoEm,
    };
  }

  static toPrismaUpdate(afericao: Afericao): Prisma.AfericaoUpdateInput {
    return {
      posto: { connect: { id: afericao.postoId } },
      responsavelId: afericao.responsavelId,
      loteId: afericao.loteId ?? null,
      bico: afericao.bicoId ? { connect: { id: afericao.bicoId } } : { disconnect: true },
      produto: afericao.produto,
      bomba: afericao.bomba,
      numeroBico: afericao.bico,
      medidaPadrao: afericao.medidaPadrao,
      resultadoMl: afericao.resultadoMl,
      situacao: afericao.situacao,
      observacoes: afericao.observacoes ?? null,
      fotoUrl: afericao.fotoUrl ?? null,
    };
  }
}
