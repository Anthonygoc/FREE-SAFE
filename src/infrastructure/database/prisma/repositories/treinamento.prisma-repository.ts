import type { PrismaClient } from '@prisma/client';

import type {
  AtualizarTreinamentoColaboradorInput,
  TreinamentoRepository,
} from '@/domain/ports/treinamento.repository';
import { prisma } from '@/lib/prisma';

export class TreinamentoPrismaRepository implements TreinamentoRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async upsert(input: AtualizarTreinamentoColaboradorInput): Promise<void> {
    const existente = await this.db.treinamentoColaborador.findUnique({
      where: {
        colaboradorId_cursoId: {
          colaboradorId: input.colaboradorId,
          cursoId: input.cursoId,
        },
      },
    });

    await this.db.treinamentoColaborador.upsert({
      where: {
        colaboradorId_cursoId: {
          colaboradorId: input.colaboradorId,
          cursoId: input.cursoId,
        },
      },
      create: {
        colaborador: { connect: { id: input.colaboradorId } },
        curso: { connect: { id: input.cursoId } },
        status: input.status,
        nota: input.nota ?? null,
        dataConclusao: input.dataConclusao ?? null,
      },
      update: {
        status: existente?.status === 'CONCLUIDO'
          ? 'CONCLUIDO'
          : input.status,
        nota: input.nota ?? existente?.nota ?? null,
        dataConclusao: existente?.dataConclusao ?? input.dataConclusao ?? null,
      },
    });
  }
}
