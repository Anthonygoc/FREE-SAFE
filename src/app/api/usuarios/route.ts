import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { createUsuarioUseCase, listUsuariosUseCase } from '@/lib/container';
import { handleApiError, validationErrorResponse } from '@/lib/handle-api-error';

const listUsuariosQuerySchema = z.object({
  postoId: z.string().uuid().optional(),
});

const createUsuarioSchema = z.object({
  nome: z.string().trim().min(1).max(150),
  email: z.string().email().max(200),
  senha: z.string().min(8),
  perfil: z.enum(['GERENTE', 'ADMINISTRATIVO']),
  postoId: z.string().uuid(),
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
    const parsed = listUsuariosQuerySchema.safeParse({
      postoId: searchParams.get('postoId') ?? undefined,
    });

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten());
    }

    const data = await listUsuariosUseCase().execute({
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

    const parsed = createUsuarioSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten());
    }

    const data = await createUsuarioUseCase().execute({
      usuario,
      nome: parsed.data.nome,
      email: parsed.data.email,
      senha: parsed.data.senha,
      perfil: parsed.data.perfil,
      postoId: parsed.data.postoId,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
