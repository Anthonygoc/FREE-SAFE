import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError, DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { deleteBicoUseCase, updateBicoUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

const produtoSchema = z.enum([
  'GASOLINA_COMUM',
  'GASOLINA_ADITIVADA',
  'GASOLINA_PREMIUM',
  'ETANOL_HIDRATADO',
  'DIESEL_S10',
  'DIESEL_S500',
]);

const paramsSchema = z.object({
  id: z.string().uuid(),
  bicoId: z.string().uuid(),
});

const updateBicoSchema = z.object({
  produto: produtoSchema,
  capacidade: z.number().positive().optional(),
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

export async function PATCH(request: Request, context: { params: Promise<{ id: string; bicoId: string }> }) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const params = await context.params;
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsedParams.error.flatten() },
        { status: 422 },
      );
    }

    const body = await request.json();
    const parsedBody = updateBicoSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsedBody.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = updateBicoUseCase();
    const data = await useCase.execute({
      usuario,
      bicoId: parsedParams.data.bicoId,
      produto: parsedBody.data.produto,
      capacidade: parsedBody.data.capacidade,
    });

    revalidatePath('/inmetro');
    revalidatePath('/inmetro/configurar');

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; bicoId: string }> }) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const params = await context.params;
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsedParams.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = deleteBicoUseCase();
    const data = await useCase.execute({
      usuario,
      bicoId: parsedParams.data.bicoId,
    });

    revalidatePath('/inmetro');
    revalidatePath('/inmetro/configurar');

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
