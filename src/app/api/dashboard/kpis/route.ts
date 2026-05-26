import { NextResponse } from 'next/server';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { getDashboardKPIsUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

function getUsuarioAutenticado(session: Awaited<ReturnType<typeof auth>>): UsuarioAutenticado {
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

export async function GET() {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const useCase = getDashboardKPIsUseCase();
    const data = await useCase.execute(usuario);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
