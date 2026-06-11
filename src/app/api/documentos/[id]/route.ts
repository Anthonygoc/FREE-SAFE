import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { deleteDocumentoUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

const paramsSchema = z.object({
  id: z.string().uuid(),
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

    const useCase = deleteDocumentoUseCase();
    const data = await useCase.execute({
      usuario,
      documentoId: parsedParams.data.id,
    });

    revalidatePath('/documentos');

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
