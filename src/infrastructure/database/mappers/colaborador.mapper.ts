import type { Colaborador as PrismaColaborador, Prisma } from '@prisma/client';

import { Colaborador } from '@/domain/entities/colaborador.entity';

export class ColaboradorMapper {
  static toDomain(raw: PrismaColaborador): Colaborador {
    return Colaborador.reconstituir({
      id: raw.id,
      postoId: raw.postoId,
      userId: raw.userId ?? undefined,
      nome: raw.nome,
      cpf: raw.cpf,
      fotoUrl: raw.fotoUrl ?? undefined,
      cargo: raw.cargo,
      dataAdmissao: raw.dataAdmissao,
      status: raw.status,
      turno: raw.turno ?? undefined,
      escala: raw.escala ?? undefined,
      telefone: raw.telefone ?? undefined,
      email: raw.email ?? undefined,
      endereco: raw.endereco ?? undefined,
      criadoEm: raw.criadoEm,
    });
  }

  static toPrismaCreate(colaborador: Colaborador): Prisma.ColaboradorCreateInput {
    return {
      id: colaborador.id,
      posto: { connect: { id: colaborador.postoId } },
      user: colaborador.userId ? { connect: { id: colaborador.userId } } : undefined,
      nome: colaborador.nome,
      cpf: colaborador.cpf,
      fotoUrl: colaborador.fotoUrl ?? null,
      cargo: colaborador.cargo,
      dataAdmissao: colaborador.dataAdmissao,
      status: colaborador.status,
      turno: colaborador.turno ?? null,
      escala: colaborador.escala ?? null,
      telefone: colaborador.telefone ?? null,
      email: colaborador.email ?? null,
      endereco: colaborador.endereco ?? null,
      criadoEm: colaborador.criadoEm,
    };
  }

  static toPrismaUpdate(colaborador: Colaborador): Prisma.ColaboradorUpdateInput {
    return {
      posto: { connect: { id: colaborador.postoId } },
      user: colaborador.userId ? { connect: { id: colaborador.userId } } : { disconnect: true },
      nome: colaborador.nome,
      cpf: colaborador.cpf,
      fotoUrl: colaborador.fotoUrl ?? null,
      cargo: colaborador.cargo,
      dataAdmissao: colaborador.dataAdmissao,
      status: colaborador.status,
      turno: colaborador.turno ?? null,
      escala: colaborador.escala ?? null,
      telefone: colaborador.telefone ?? null,
      email: colaborador.email ?? null,
      endereco: colaborador.endereco ?? null,
    };
  }
}
