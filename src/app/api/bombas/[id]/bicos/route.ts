import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError, DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/handle-api-error';
import { createBicoUseCase, listBicosByBombaUseCase } from '@/lib/container';

const idSchema = z.string().uuid();

const createBicoSchema = z.object({
  numero: z.number().int().positive(),
  produto: z.enum([
    'GASOLINA_COMUM',
    'GASOLINA_ADITIVADA',
    'GASOLINA_PREMIUM',
    'ETANOL_HIDRATADO',
    'DIESEL_S10',
    'DIESEL_S500',
  ]),
  capacidade: z.number().positive().optional(),
});

function getUsuarioAutenticado(session: any): UsuarioAutenticado {
  if (!session?.user) {
    throw new AuthenticationError();
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

    const { id } = await context.params;
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = listBicosByBombaUseCase();
    const data = await useCase.execute({
      usuario,
      bombaId: parsed.data,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const { id } = await context.params;
    const parsedId = idSchema.safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsedId.error.flatten() },
        { status: 422 },
      );
    }

    const body = await request.json();
    const parsedBody = createBicoSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsedBody.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = createBicoUseCase();
    const data = await useCase.execute({
      usuario,
      bombaId: parsedId.data,
      numero: parsedBody.data.numero,
      produto: parsedBody.data.produto,
      capacidade: parsedBody.data.capacidade,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
