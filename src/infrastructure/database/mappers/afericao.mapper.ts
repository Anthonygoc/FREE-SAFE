import type { Afericao as PrismaAfericao, Prisma } from '@prisma/client';

import { Afericao } from '@/domain/entities/afericao.entity';

export class AfericaoMapper {
  static toDomain(raw: PrismaAfericao): Afericao {
    return Afericao.reconstituir({
      id: raw.id,
      postoId: raw.postoId,
      responsavelId: raw.responsavelId,
      produto: raw.produto,
      bomba: raw.bomba,
      bico: raw.bico,
      medidaPadrao: raw.medidaPadrao,
      resultadoMl: raw.resultadoMl,
      situacao: raw.situacao,
      observacoes: raw.observacoes ?? undefined,
      criadoEm: raw.criadoEm,
    });
  }

  static toPrismaCreate(afericao: Afericao): Prisma.AfericaoCreateInput {
    return {
      id: afericao.id,
      posto: { connect: { id: afericao.postoId } },
      responsavelId: afericao.responsavelId,
      produto: afericao.produto,
      bomba: afericao.bomba,
      bico: afericao.bico,
      medidaPadrao: afericao.medidaPadrao,
      resultadoMl: afericao.resultadoMl,
      situacao: afericao.situacao,
      observacoes: afericao.observacoes ?? null,
      fotosUrls: [],
      relatorioUrl: null,
      criadoEm: afericao.criadoEm,
    };
  }

  static toPrismaUpdate(afericao: Afericao): Prisma.AfericaoUpdateInput {
    return {
      posto: { connect: { id: afericao.postoId } },
      responsavelId: afericao.responsavelId,
      produto: afericao.produto,
      bomba: afericao.bomba,
      bico: afericao.bico,
      medidaPadrao: afericao.medidaPadrao,
      resultadoMl: afericao.resultadoMl,
      situacao: afericao.situacao,
      observacoes: afericao.observacoes ?? null,
    };
  }
}
