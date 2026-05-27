import type { Prisma, ProvaResposta as PrismaProvaResposta } from '@prisma/client';

import type { AlternativaQuestao } from '@/domain/entities/curso-questao.entity';
import { ProvaAttempt } from '@/domain/entities/prova-attempt.entity';

type PrismaProvaAttemptWithRespostas = Prisma.ProvaAttemptGetPayload<{
  include: { respostas: true };
}>;

export class ProvaAttemptMapper {
  static toDomain(raw: PrismaProvaAttemptWithRespostas): ProvaAttempt {
    return ProvaAttempt.reconstituir({
      id: raw.id,
      colaboradorId: raw.colaboradorId,
      cursoId: raw.cursoId,
      nota: raw.nota,
      aprovado: raw.aprovado,
      certificadoUrl: raw.certificadoUrl ?? undefined,
      criadoEm: raw.criadoEm,
      respostas: raw.respostas.map((resposta) => ProvaAttemptMapper.toResposta(resposta)),
    });
  }

  static toPrisma(attempt: ProvaAttempt): Prisma.ProvaAttemptCreateInput {
    return {
      id: attempt.id,
      colaborador: { connect: { id: attempt.colaboradorId } },
      curso: { connect: { id: attempt.cursoId } },
      nota: attempt.nota,
      aprovado: attempt.aprovado,
      certificadoUrl: attempt.certificadoUrl ?? null,
      criadoEm: attempt.criadoEm,
      respostas: {
        create: attempt.respostas.map((resposta) => ({
          id: resposta.id,
          questao: { connect: { id: resposta.questaoId } },
          resposta: resposta.resposta,
          correta: resposta.correta,
        })),
      },
    };
  }

  static toPrismaRespostasUpdate(attempt: ProvaAttempt): Prisma.ProvaRespostaCreateWithoutAttemptInput[] {
    return attempt.respostas.map((resposta) => ({
      id: resposta.id,
      questao: { connect: { id: resposta.questaoId } },
      resposta: resposta.resposta,
      correta: resposta.correta,
    }));
  }

  private static toResposta(raw: PrismaProvaResposta) {
    return {
      id: raw.id,
      attemptId: raw.attemptId,
      questaoId: raw.questaoId,
      resposta: raw.resposta as AlternativaQuestao,
      correta: raw.correta,
    };
  }
}
