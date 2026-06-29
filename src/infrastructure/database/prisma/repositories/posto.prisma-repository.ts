import type { PrismaClient } from '@prisma/client';

import type { Posto, PostoRepository } from '@/domain/ports/posto.repository';
import { prisma } from '@/lib/prisma';

export class PostoPrismaRepository implements PostoRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listar(): Promise<Posto[]> {
    return this.db.posto.findMany({
      orderBy: { nome: 'asc' },
    }) as Promise<Posto[]>;
  }

  async buscarPorId(id: string): Promise<Posto | null> {
    return this.db.posto.findUnique({ where: { id } }) as Promise<Posto | null>;
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
        logoUrl: posto.logoUrl ?? null,
        maxGerentes: posto.maxGerentes,
        maxAdministrativos: posto.maxAdministrativos,
        toleranciaInmetroMl: posto.toleranciaInmetroMl,
        ativo: posto.ativo,
        criadoEm: posto.criadoEm,
        atualizadoEm: posto.atualizadoEm,
      } as any,
      update: {
        nome: posto.nome,
        razaoSocial: posto.razaoSocial,
        cnpj: posto.cnpj,
        inscricaoEstadual: posto.inscricaoEstadual ?? null,
        endereco: posto.endereco,
        cidade: posto.cidade,
        uf: posto.uf,
        gerenteId: posto.gerenteId ?? null,
        logoUrl: posto.logoUrl ?? null,
        maxGerentes: posto.maxGerentes,
        maxAdministrativos: posto.maxAdministrativos,
        toleranciaInmetroMl: posto.toleranciaInmetroMl,
        ativo: posto.ativo,
      } as any,
    });
  }

  async contar(): Promise<number> {
    return this.db.posto.count();
  }
}
