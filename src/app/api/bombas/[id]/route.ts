import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { deleteBombaUseCase, updateBombaUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const updateBombaSchema = z.object({
  numero: z.number().int().positive().optional(),
  modelo: z.string().max(100).optional(),
}).refine(
  (data) => data.numero !== undefined || data.modelo !== undefined,
  { message: 'Informe pelo menos numero ou modelo' },
);

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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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
    const parsedBody = updateBombaSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsedBody.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = updateBombaUseCase();
    const data = await useCase.execute({
      usuario,
      bombaId: parsedParams.data.id,
      numero: parsedBody.data.numero,
      modelo: parsedBody.data.modelo,
    });

    revalidatePath('/inmetro');
    revalidatePath('/inmetro/configurar');

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
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

    const useCase = deleteBombaUseCase();
    const data = await useCase.execute({
      usuario,
      bombaId: parsedParams.data.id,
    });

    revalidatePath('/inmetro');
    revalidatePath('/inmetro/configurar');

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
