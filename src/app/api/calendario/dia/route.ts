import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError } from '@/domain/errors/domain.errors';
import { AUDIT_ACOES, AUDIT_RECURSOS } from '@/domain/entities/audit-log.entity';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/handle-api-error';
import { listarResumoDiaUseCase } from '@/lib/container';

const resumoDiaQuerySchema = z.object({
  postoId: z.string().uuid().optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  usuarioId: z.string().uuid().optional(),
  recurso: z.enum(AUDIT_RECURSOS).optional(),
  acao: z.enum(AUDIT_ACOES).optional(),
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

function normalizarParam(value: string | null): string | undefined {
  if (value === null) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const { searchParams } = new URL(request.url);
    const parsed = resumoDiaQuerySchema.safeParse({
      postoId: normalizarParam(searchParams.get('postoId')),
      data: normalizarParam(searchParams.get('data')),
      usuarioId: normalizarParam(searchParams.get('usuarioId')),
      recurso: normalizarParam(searchParams.get('recurso')),
      acao: normalizarParam(searchParams.get('acao')),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const data = await listarResumoDiaUseCase().execute({
      usuario,
      postoId: parsed.data.postoId,
      data: parsed.data.data,
      usuarioId: parsed.data.usuarioId,
      recurso: parsed.data.recurso,
      acao: parsed.data.acao,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
