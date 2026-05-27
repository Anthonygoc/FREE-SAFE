import type { PrismaClient } from '@prisma/client';

import type { CursoConteudoRepository } from '@/domain/ports/curso-conteudo.repository';
import type { CursoConteudo } from '@/domain/entities/curso-conteudo.entity';
import { CursoConteudoMapper } from '@/infrastructure/database/mappers/curso-conteudo.mapper';
import { prisma } from '@/lib/prisma';

export class CursoConteudoPrismaRepository implements CursoConteudoRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listarPorCurso(cursoId: string): Promise<CursoConteudo[]> {
    const registros = await this.db.cursoConteudo.findMany({
      where: { cursoId },
      orderBy: { ordem: 'asc' },
    });

    return registros.map(CursoConteudoMapper.toDomain);
  }

  async buscarPorId(id: string): Promise<CursoConteudo | null> {
    const raw = await this.db.cursoConteudo.findUnique({ where: { id } });
    return raw ? CursoConteudoMapper.toDomain(raw) : null;
  }
}
