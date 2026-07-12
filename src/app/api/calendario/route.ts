import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { listarCalendarioMesUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

const calendarioQuerySchema = z.object({
  postoId: z.string().uuid().optional(),
  ano: z.coerce.number().int().min(2000).max(9999),
  mes: z.coerce.number().int().min(1).max(12),
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
    const parsed = calendarioQuerySchema.safeParse({
      postoId: normalizarParam(searchParams.get('postoId')),
      ano: normalizarParam(searchParams.get('ano')),
      mes: normalizarParam(searchParams.get('mes')),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const data = await listarCalendarioMesUseCase().execute({
      usuario,
      postoId: parsed.data.postoId,
      ano: parsed.data.ano,
      mes: parsed.data.mes,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
