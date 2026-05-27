import type { PrismaClient } from '@prisma/client';

import { CursoQuestao } from '@/domain/entities/curso-questao.entity';
import type { CursoQuestaoRepository } from '@/domain/ports/curso-questao.repository';
import { prisma } from '@/lib/prisma';

export class CursoQuestaoPrismaRepository implements CursoQuestaoRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listarPorCurso(cursoId: string): Promise<CursoQuestao[]> {
    const registros = await this.db.cursoQuestao.findMany({
      where: { cursoId },
      orderBy: { ordem: 'asc' },
    });

    return registros.map((registro) => CursoQuestao.reconstituir({
      id: registro.id,
      cursoId: registro.cursoId,
      ordem: registro.ordem,
      enunciado: registro.enunciado,
      alternativas: registro.alternativas as {
        A: string;
        B: string;
        C: string;
        D: string;
      },
      gabarito: registro.gabarito as 'A' | 'B' | 'C' | 'D',
      criadoEm: registro.criadoEm,
    }));
  }
}
