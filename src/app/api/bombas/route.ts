import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError, DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { handleApiError, validationErrorResponse } from '@/lib/handle-api-error';
import { createBombaUseCase, listBombasByPostoUseCase } from '@/lib/container';

const querySchema = z.object({
  postoId: z.string().uuid(),
});

const createBombaSchema = z.object({
  postoId: z.string().uuid(),
  numero: z.number().int().positive(),
  modelo: z.string().max(100).optional(),
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

export async function GET(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      postoId: searchParams.get('postoId'),
    });

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten());
    }

    const useCase = listBombasByPostoUseCase();
    const data = await useCase.execute({
      usuario,
      postoId: parsed.data.postoId,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const body = await request.json();
    const parsed = createBombaSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten());
    }

    const useCase = createBombaUseCase();
    const data = await useCase.execute({
      usuario,
      postoId: parsed.data.postoId,
      numero: parsed.data.numero,
      modelo: parsed.data.modelo,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
