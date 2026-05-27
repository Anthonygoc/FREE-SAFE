import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/handle-api-error';
import { submitProvaUseCase } from '@/lib/container';

const idSchema = z.string().uuid();
const submitProvaSchema = z.object({
  respostas: z.array(z.object({
    questaoId: z.string().uuid(),
    resposta: z.enum(['A', 'B', 'C', 'D']),
  })).min(1),
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

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);
    const { searchParams } = new URL(request.url);
    const colaboradorIdParam = searchParams.get('colaboradorId');

    const { id } = await context.params;
    const parsedId = idSchema.safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsedId.error.flatten() },
        { status: 422 },
      );
    }

    const body = await request.json();
    const input = submitProvaSchema.parse(body);
    const colaboradorId = colaboradorIdParam ? idSchema.parse(colaboradorIdParam) : undefined;

    const data = await submitProvaUseCase().execute({
      usuario,
      cursoId: parsedId.data,
      respostas: input.respostas,
      colaboradorId,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Payload inválido', details: error.issues }, { status: 400 });
    }

    return handleApiError(error);
  }
}
