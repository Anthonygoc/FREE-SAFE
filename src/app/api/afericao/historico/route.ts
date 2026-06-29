import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/handle-api-error';
import { listHistoricoAfericoesByPostoUseCase } from '@/lib/container';

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
    const postoId = searchParams.get('postoId');

    if (!postoId) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: { postoId: ['postoId é obrigatório'] } },
        { status: 422 },
      );
    }

    const paginaParsed = z.coerce.number().int().positive().default(1).safeParse(searchParams.get('pagina') ?? '1');
    if (!paginaParsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: paginaParsed.error.flatten() },
        { status: 422 },
      );
    }

    const bombaRaw = searchParams.get('bomba');
    const bombaParsed = bombaRaw === null
      ? { success: true as const, data: undefined }
      : z.coerce.number().int().positive().safeParse(bombaRaw);

    if (!bombaParsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: bombaParsed.error.flatten() },
        { status: 422 },
      );
    }

    const data = await listHistoricoAfericoesByPostoUseCase().execute({
      usuario,
      postoId,
      pagina: paginaParsed.data,
      bomba: bombaParsed.data,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
