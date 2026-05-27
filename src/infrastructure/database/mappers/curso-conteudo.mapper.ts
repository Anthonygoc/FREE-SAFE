import type { CursoConteudo as PrismaCursoConteudo } from '@prisma/client';

import { CursoConteudo } from '@/domain/entities/curso-conteudo.entity';

export class CursoConteudoMapper {
  static toDomain(raw: PrismaCursoConteudo): CursoConteudo {
    return CursoConteudo.reconstituir({
      id: raw.id,
      cursoId: raw.cursoId,
      ordem: raw.ordem,
      titulo: raw.titulo,
      tipo: raw.tipo,
      conteudo: raw.conteudo,
      criadoEm: raw.criadoEm,
    });
  }
}
