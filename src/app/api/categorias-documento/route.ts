import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError, DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { createCategoriaUseCase, listCategoriasUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

const createCategoriaSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  descricao: z.string().trim().min(1).max(300).optional(),
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

export async function GET() {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const useCase = listCategoriasUseCase();
    const data = await useCase.execute({ usuario });

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
    const parsed = createCategoriaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = createCategoriaUseCase();
    const data = await useCase.execute({
      usuario,
      nome: parsed.data.nome,
      descricao: parsed.data.descricao,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
