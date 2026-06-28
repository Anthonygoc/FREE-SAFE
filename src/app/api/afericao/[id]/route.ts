import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError, DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { deleteAfericaoUseCase, getAfericaoByIdUseCase } from '@/lib/container';
import { handleApiError, validationErrorResponse } from '@/lib/handle-api-error';

const idSchema = z.string().uuid();

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
      return validationErrorResponse(parsed.error.flatten());
    }

    const useCase = getAfericaoByIdUseCase();
    const data = await useCase.execute({
      usuario,
      afericaoId: parsed.data,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const { id } = await context.params;
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten());
    }

    const useCase = deleteAfericaoUseCase();
    const data = await useCase.execute({
      usuario,
      afericaoId: parsed.data,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
