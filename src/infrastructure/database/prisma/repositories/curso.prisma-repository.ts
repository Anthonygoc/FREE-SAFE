import type { Prisma, PrismaClient } from '@prisma/client';

import type {
  BuscarCursoComProgressoParams,
  CursoComProgresso,
  CursoRepository,
} from '@/domain/ports/curso.repository';
import { prisma } from '@/lib/prisma';

type PrismaCursoComRelacoes = Prisma.CursoGetPayload<{
  include: {
    _count: {
      select: {
        conteudos: true;
        questoes: true;
      };
    };
    treinamentos: true;
  };
}>;

export class CursoPrismaRepository implements CursoRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listarAtivosComProgresso(params?: BuscarCursoComProgressoParams): Promise<CursoComProgresso[]> {
    const registros = await this.db.curso.findMany({
      where: { ativo: true },
      include: this.buildInclude(params?.colaboradorId),
      orderBy: { nome: 'asc' },
    });

    return registros.map((registro) => this.toCursoComProgresso(registro, params?.cargo));
  }

  async buscarPorId(id: string): Promise<CursoComProgresso | null> {
    const raw = await this.db.curso.findUnique({
      where: { id },
      include: this.buildInclude(),
    });

    return raw ? this.toCursoComProgresso(raw) : null;
  }

  async buscarPorIdComProgresso(
    id: string,
    params?: BuscarCursoComProgressoParams,
  ): Promise<CursoComProgresso | null> {
    const raw = await this.db.curso.findFirst({
      where: { id, ativo: true },
      include: this.buildInclude(params?.colaboradorId),
    });

    return raw ? this.toCursoComProgresso(raw, params?.cargo) : null;
  }

  private buildInclude(colaboradorId?: string) {
    return {
      _count: {
        select: {
          conteudos: true,
          questoes: true,
        },
      },
      treinamentos: {
        where: colaboradorId ? { colaboradorId } : { id: '__sem_treinamento__' },
        take: 1,
      },
    } satisfies Prisma.CursoInclude;
  }

  private toCursoComProgresso(raw: PrismaCursoComRelacoes, cargo?: string): CursoComProgresso {
    const treinamento = raw.treinamentos[0];
    const obrigatorio = cargo
      ? raw.cargosObrigatorios.includes('TODOS') || raw.cargosObrigatorios.includes(cargo)
      : false;

    return {
      id: raw.id,
      nome: raw.nome,
      descricao: raw.descricao ?? undefined,
      cargaHoraria: raw.cargaHoraria ?? undefined,
      validadeDias: raw.validadeDias ?? undefined,
      cargosObrigatorios: raw.cargosObrigatorios,
      ativo: raw.ativo,
      criadoEm: raw.criadoEm,
      totalConteudos: raw._count.conteudos,
      totalQuestoes: raw._count.questoes,
      obrigatorio,
      treinamento: treinamento
        ? {
            status: treinamento.status,
            nota: treinamento.nota ?? undefined,
            dataConclusao: treinamento.dataConclusao ?? undefined,
            certificadoUrl: treinamento.certificadoUrl ?? undefined,
          }
        : undefined,
    };
  }
}
