import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { createAfericaoUseCase, listAfericoesByPostoUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

const produtoSchema = z.enum([
  'GASOLINA_COMUM',
  'GASOLINA_ADITIVADA',
  'GASOLINA_PREMIUM',
  'ETANOL_HIDRATADO',
  'DIESEL_S10',
  'DIESEL_S500',
]);

const createAfericaoSchema = z.object({
  postoId: z.string().uuid(),
  produto: produtoSchema,
  bomba: z.number().int().positive(),
  bico: z.number().int().positive(),
  resultadoMl: z.number().min(-500).max(500),
  observacoes: z.string().max(500).optional(),
  medidaPadrao: z.number().default(20).optional(),
});

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

    const { searchParams } = new URL(request.url);
    const postoId = searchParams.get('postoId');

    if (!postoId) {
      return NextResponse.json({ error: 'dados_invalidos', detalhes: { postoId: ['postoId é obrigatório'] } }, { status: 422 });
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

    const useCase = listAfericoesByPostoUseCase();
    const data = await useCase.execute({
      usuario,
      postoId,
      bomba: bombaParsed.data,
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
    const parsed = createAfericaoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = createAfericaoUseCase();
    const data = await useCase.execute({
      usuario,
      ...parsed.data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
