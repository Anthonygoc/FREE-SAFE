import { Prisma, type PrismaClient } from '@prisma/client';

import type { ColaboradorRepository, ListarColaboradoresFiltros } from '@/domain/ports/colaborador.repository';
import type { Colaborador } from '@/domain/entities/colaborador.entity';
import { ColaboradorMapper } from '@/infrastructure/database/mappers/colaborador.mapper';
import { prisma } from '@/lib/prisma';

export class ColaboradorPrismaRepository implements ColaboradorRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listarPorPosto(
    postoId: string,
    filtros?: ListarColaboradoresFiltros,
  ): Promise<{ itens: Colaborador[]; total: number }> {
    const where = {
      postoId,
      ...(filtros?.cargo ? { cargo: filtros.cargo } : {}),
      ...(filtros?.status ? { status: filtros.status } : {}),
    };

    const [registros, total] = await Promise.all([
      this.db.colaborador.findMany({
        where,
        orderBy: { nome: 'asc' },
        take: filtros?.limite,
        skip: filtros?.offset,
      }),
      this.db.colaborador.count({ where }),
    ]);

    return {
      itens: registros.map(ColaboradorMapper.toDomain),
      total,
    };
  }

  async buscarPorId(id: string): Promise<Colaborador | null> {
    const raw = await this.db.colaborador.findUnique({ where: { id } });
    return raw ? ColaboradorMapper.toDomain(raw) : null;
  }

  async buscarPorCpf(cpf: string): Promise<Colaborador | null> {
    const raw = await this.db.colaborador.findUnique({ where: { cpf } });
    return raw ? ColaboradorMapper.toDomain(raw) : null;
  }

  async buscarPorUserId(userId: string): Promise<Colaborador | null> {
    const raw = await this.db.colaborador.findFirst({ where: { userId } });
    return raw ? ColaboradorMapper.toDomain(raw) : null;
  }

  async salvar(colaborador: Colaborador): Promise<void> {
    await this.db.colaborador.upsert({
      where: { id: colaborador.id },
      create: ColaboradorMapper.toPrismaCreate(colaborador),
      update: ColaboradorMapper.toPrismaUpdate(colaborador),
    });
  }

  async atualizar(colaborador: Colaborador): Promise<void> {
    await this.db.colaborador.update({
      where: { id: colaborador.id },
      data: {
        nome: colaborador.nome,
        cpf: colaborador.cpf,
        cargo: colaborador.cargo,
        telefone: colaborador.telefone ?? null,
        email: colaborador.email ?? null,
        endereco: colaborador.endereco ?? null,
        turno: colaborador.turno ?? null,
        escala: colaborador.escala ?? null,
        status: colaborador.status,
        fotoUrl: colaborador.fotoUrl ?? null,
      },
    });
  }

  async anonimizar(colaboradorId: string): Promise<void> {
    const cpfPlaceholder = `ANON-${colaboradorId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 9).toUpperCase()}`;

    await this.db.$transaction([
      this.db.colaborador.update({
        where: { id: colaboradorId },
        data: {
          userId: null,
          nome: 'Colaborador anonimizado',
          cpf: cpfPlaceholder,
          rg: null,
          fotoUrl: null,
          telefone: null,
          email: null,
          endereco: null,
        },
      }),
      this.db.entrevista.updateMany({
        where: { colaboradorId },
        data: {
          respostas: Prisma.DbNull,
          observacoes: null,
          compromissoColaborador: null,
          assinaturaColaboradorUrl: null,
        },
      }),
    ]);
  }

  async contarAtivos(): Promise<number> {
    return this.db.colaborador.count({ where: { status: 'ATIVO' } });
  }
}
