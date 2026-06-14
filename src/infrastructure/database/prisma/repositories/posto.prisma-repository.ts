import type { PrismaClient } from '@prisma/client';

import type { Posto, PostoRepository } from '@/domain/ports/posto.repository';
import { prisma } from '@/lib/prisma';

export class PostoPrismaRepository implements PostoRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listar(): Promise<Posto[]> {
    return this.db.posto.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string): Promise<Posto | null> {
    return this.db.posto.findUnique({ where: { id } });
  }

  async salvar(posto: Posto): Promise<void> {
    await this.db.posto.upsert({
      where: { id: posto.id },
      create: {
        id: posto.id,
        nome: posto.nome,
        razaoSocial: posto.razaoSocial,
        cnpj: posto.cnpj,
        inscricaoEstadual: posto.inscricaoEstadual ?? null,
        endereco: posto.endereco,
        cidade: posto.cidade,
        uf: posto.uf,
        gerenteId: posto.gerenteId ?? null,
        maxGerentes: posto.maxGerentes,
        maxAdministrativos: posto.maxAdministrativos,
        ativo: posto.ativo,
        criadoEm: posto.criadoEm,
        atualizadoEm: posto.atualizadoEm,
      },
      update: {
        nome: posto.nome,
        razaoSocial: posto.razaoSocial,
        cnpj: posto.cnpj,
        inscricaoEstadual: posto.inscricaoEstadual ?? null,
        endereco: posto.endereco,
        cidade: posto.cidade,
        uf: posto.uf,
        gerenteId: posto.gerenteId ?? null,
        maxGerentes: posto.maxGerentes,
        maxAdministrativos: posto.maxAdministrativos,
        ativo: posto.ativo,
      },
    });
  }

  async contar(): Promise<number> {
    return this.db.posto.count();
  }
}
