import type { PrismaClient } from '@prisma/client';

import type { ProvaAttempt } from '@/domain/entities/prova-attempt.entity';
import type { ProvaAttemptRepository } from '@/domain/ports/prova-attempt.repository';
import { ProvaAttemptMapper } from '@/infrastructure/database/mappers/prova-attempt.mapper';
import { prisma } from '@/lib/prisma';

export class ProvaAttemptPrismaRepository implements ProvaAttemptRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async salvar(attempt: ProvaAttempt): Promise<void> {
    await this.db.provaAttempt.upsert({
      where: { id: attempt.id },
      create: ProvaAttemptMapper.toPrisma(attempt),
      update: {
        colaborador: { connect: { id: attempt.colaboradorId } },
        curso: { connect: { id: attempt.cursoId } },
        nota: attempt.nota,
        aprovado: attempt.aprovado,
        certificadoUrl: attempt.certificadoUrl ?? null,
        respostas: {
          deleteMany: {},
          create: ProvaAttemptMapper.toPrismaRespostasUpdate(attempt),
        },
      },
    });
  }

  async buscarUltimoPorColaboradorECurso(
    colaboradorId: string,
    cursoId: string,
  ): Promise<ProvaAttempt | null> {
    const raw = await this.db.provaAttempt.findFirst({
      where: { colaboradorId, cursoId },
      include: { respostas: true },
      orderBy: { criadoEm: 'desc' },
    });

    return raw ? ProvaAttemptMapper.toDomain(raw) : null;
  }

  async listarPorColaborador(colaboradorId: string): Promise<ProvaAttempt[]> {
    const registros = await this.db.provaAttempt.findMany({
      where: { colaboradorId },
      include: { respostas: true },
      orderBy: { criadoEm: 'desc' },
    });

    return registros.map(ProvaAttemptMapper.toDomain);
  }
}
