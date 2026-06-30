import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { getMeuPerfilUseCase, updateMeuPerfilUseCase } from '@/lib/container';
import { handleApiError, validationErrorResponse } from '@/lib/handle-api-error';

const updatePerfilSchema = z.object({
  nome: z.string().trim().min(1).max(150).optional(),
  email: z.string().trim().email().max(200).optional(),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'Informe pelo menos um campo para atualização' },
);

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

export async function GET() {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);
    const data = await getMeuPerfilUseCase().execute({ usuario });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);
    const body = await request.json();

    const parsed = updatePerfilSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten());
    }

    const data = await updateMeuPerfilUseCase().execute({
      usuario,
      ...parsed.data,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
