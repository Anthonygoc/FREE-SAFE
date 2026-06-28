import { NextResponse } from 'next/server';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { listarNotificacoesUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

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
    const data = await listarNotificacoesUseCase().execute(usuario);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
