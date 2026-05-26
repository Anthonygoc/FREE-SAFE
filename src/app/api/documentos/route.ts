import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { documentoRepository } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

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

export async function GET(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    if (usuario.perfil !== 'ADMIN' && usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    const { searchParams } = new URL(request.url);
    const postoId = searchParams.get('postoId');

    if (!postoId) {
      return NextResponse.json({ error: 'dados_invalidos', detalhes: { postoId: ['postoId é obrigatório'] } }, { status: 422 });
    }

    if (usuario.perfil === 'GERENTE' && usuario.postoId !== postoId) {
      throw new UnauthorizedError('Gerente só pode visualizar documentos do próprio posto');
    }

    const vencendoRaw = searchParams.get('vencendo');
    const vencendoParsed = vencendoRaw === null
      ? { success: true as const, data: undefined }
      : z.coerce.number().int().positive().safeParse(vencendoRaw);

    if (!vencendoParsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: vencendoParsed.error.flatten() },
        { status: 422 },
      );
    }

    const repo = documentoRepository();

    const data = vencendoParsed.data === undefined
      ? await repo.listarPorPosto(postoId)
      : (await repo.listarVencendoEm(vencendoParsed.data)).filter((documento) => documento.postoId === postoId);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
