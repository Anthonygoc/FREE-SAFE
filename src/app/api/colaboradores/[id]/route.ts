import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { getColaboradorByIdUseCase, updateColaboradorUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

const statusSchema = z.enum(['ATIVO', 'AFASTADO', 'DESLIGADO']);

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const updateColaboradorSchema = z.object({
  nome: z.string().min(1).max(150).optional(),
  cpf: z.string().min(11).max(14).optional(),
  cargo: z.string().min(1).max(80).optional(),
  telefone: z.string().max(20).optional(),
  email: z.string().email().max(200).optional(),
  endereco: z.string().max(300).optional(),
  turno: z.string().max(30).optional(),
  escala: z.string().max(30).optional(),
  status: statusSchema.optional(),
  fotoUrl: z.string().optional(),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'Informe pelo menos um campo para atualização' },
);

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

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const params = await context.params;
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsedParams.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = getColaboradorByIdUseCase();
    const data = await useCase.execute({
      usuario,
      colaboradorId: parsedParams.data.id,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const params = await context.params;
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsedParams.error.flatten() },
        { status: 422 },
      );
    }

    const body = await request.json();
    const parsedBody = updateColaboradorSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsedBody.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = updateColaboradorUseCase();
    const data = await useCase.execute({
      usuario,
      colaboradorId: parsedParams.data.id,
      ...parsedBody.data,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
