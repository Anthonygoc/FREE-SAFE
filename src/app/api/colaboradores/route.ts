import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { CreateColaboradorUseCase } from '@/application/use-cases/colaboradores/create-colaborador.use-case';
import { ListColaboradoresByPostoUseCase } from '@/application/use-cases/colaboradores/list-colaboradores-by-posto.use-case';
import { DomainError } from '@/domain/errors/domain.errors';
import { ColaboradorPrismaRepository } from '@/infrastructure/database/prisma/repositories/colaborador.prisma-repository';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/handle-api-error';

const statusSchema = z.enum(['ATIVO', 'AFASTADO', 'DESLIGADO']);

const createColaboradorSchema = z.object({
  postoId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  nome: z.string().min(1).max(150),
  cpf: z.string().min(11).max(14),
  cargo: z.string().min(1).max(80),
  dataAdmissao: z.coerce.date(),
  status: statusSchema.optional(),
  turno: z.string().max(30).optional(),
  escala: z.string().max(30).optional(),
  telefone: z.string().max(20).optional(),
  email: z.string().email().max(200).optional(),
  endereco: z.string().max(300).optional(),
});

function getUsuarioAutenticado(session: any): UsuarioAutenticado {
  if (!session?.user) {
    throw new DomainError('Não autenticado');
  }

  return {
    id: session.user.id,
    nome: session.user.name ?? '',
    email: session.user.email ?? '',
    perfil: session.user.perfil as UsuarioAutenticado['perfil'],
    postoId: session.user.postoId,
  };
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const { searchParams } = new URL(request.url);
    const postoId = searchParams.get('postoId');
    const cargo = searchParams.get('cargo') ?? undefined;
    const statusRaw = searchParams.get('status') ?? undefined;

    if (!postoId) {
      return NextResponse.json({ error: 'postoId é obrigatório' }, { status: 400 });
    }

    const status = statusRaw ? statusSchema.parse(statusRaw) : undefined;

    const useCase = new ListColaboradoresByPostoUseCase(new ColaboradorPrismaRepository());
    const data = await useCase.execute({
      usuario,
      postoId,
      cargo,
      status,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parâmetros inválidos', details: error.issues }, { status: 400 });
    }

    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);
    const body = await request.json();

    const input = createColaboradorSchema.parse(body);

    const useCase = new CreateColaboradorUseCase(new ColaboradorPrismaRepository());
    const output = await useCase.execute({
      usuario,
      ...input,
    });

    return NextResponse.json({ data: output }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Payload inválido', details: error.issues }, { status: 400 });
    }

    return handleApiError(error);
  }
}
