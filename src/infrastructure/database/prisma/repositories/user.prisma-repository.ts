import type { PrismaClient } from '@prisma/client';

import type { User, UserRepository, UserResumo } from '@/domain/ports/user.repository';
import { prisma } from '@/lib/prisma';

type UserResumoRow = {
  id: string;
  nome: string;
  email: string;
  perfil: User['perfil'];
  postoId: string | null;
  ativo: boolean;
  criadoEm: Date;
};

function mapUserResumo(raw: UserResumoRow): UserResumo {
  return {
    id: raw.id,
    nome: raw.nome,
    email: raw.email,
    perfil: raw.perfil,
    postoId: raw.postoId,
    ativo: raw.ativo,
    criadoEm: raw.criadoEm,
  };
}

function mapUser(raw: {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  perfil: User['perfil'];
  postoId: string | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}): User {
  return {
    id: raw.id,
    nome: raw.nome,
    email: raw.email,
    senhaHash: raw.senhaHash,
    perfil: raw.perfil,
    postoId: raw.postoId,
    ativo: raw.ativo,
    criadoEm: raw.criadoEm,
    atualizadoEm: raw.atualizadoEm,
  };
}

export class UserPrismaRepository implements UserRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listarPorPosto(postoId: string): Promise<UserResumo[]> {
    const rows = await this.db.user.findMany({
      where: { postoId },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        postoId: true,
        ativo: true,
        criadoEm: true,
      },
      orderBy: { nome: 'asc' },
    });

    return rows.map(mapUserResumo);
  }

  async listarTodos(): Promise<UserResumo[]> {
    const rows = await this.db.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        postoId: true,
        ativo: true,
        criadoEm: true,
      },
      orderBy: { nome: 'asc' },
    });

    return rows.map(mapUserResumo);
  }

  async buscarPorId(id: string): Promise<User | null> {
    const raw = await this.db.user.findUnique({ where: { id } });
    return raw ? mapUser(raw) : null;
  }

  async buscarPorEmail(email: string): Promise<User | null> {
    const raw = await this.db.user.findUnique({ where: { email } });
    return raw ? mapUser(raw) : null;
  }

  async salvar(user: User): Promise<void> {
    await this.db.user.create({
      data: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        senhaHash: user.senhaHash,
        perfil: user.perfil,
        postoId: user.postoId,
        ativo: user.ativo,
        criadoEm: user.criadoEm,
        atualizadoEm: user.atualizadoEm,
      },
    });
  }

  async atualizar(user: User): Promise<void> {
    await this.db.user.update({
      where: { id: user.id },
      data: {
        nome: user.nome,
        senhaHash: user.senhaHash,
        perfil: user.perfil,
        postoId: user.postoId,
        ativo: user.ativo,
      },
    });
  }
}
