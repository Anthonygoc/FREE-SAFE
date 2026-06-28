import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError, DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { getResultadoProvaUseCase } from '@/lib/container';
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
    const { searchParams } = new URL(_request.url);
    const colaboradorIdParam = searchParams.get('colaboradorId');

    const { id } = await context.params;
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const colaboradorId = colaboradorIdParam ? idSchema.parse(colaboradorIdParam) : undefined;

    const data = await getResultadoProvaUseCase().execute({
      usuario,
      cursoId: parsed.data,
      colaboradorId,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.flatten());
    }

    return handleApiError(error);
  }
}
