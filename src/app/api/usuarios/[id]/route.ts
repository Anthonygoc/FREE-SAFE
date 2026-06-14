import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { toggleUsuarioAtivoUseCase, updateUsuarioUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const updateUsuarioSchema = z.object({
  nome: z.string().trim().min(1).max(150).optional(),
  perfil: z.enum(['ADMIN', 'GERENTE', 'ADMINISTRATIVO']).optional(),
  postoId: z.string().uuid().optional(),
  ativo: z.boolean().optional(),
  novaSenha: z.string().min(8).optional(),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'Informe pelo menos um campo para atualização' },
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

function hasOnlyAtivoField(data: z.infer<typeof updateUsuarioSchema>) {
  return (
    data.ativo !== undefined
    && data.nome === undefined
    && data.perfil === undefined
    && data.postoId === undefined
    && data.novaSenha === undefined
  );
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
    const parsedBody = updateUsuarioSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsedBody.error.flatten() },
        { status: 422 },
      );
    }

    const payload = parsedBody.data;

    if (hasOnlyAtivoField(payload)) {
      const data = await toggleUsuarioAtivoUseCase().execute({
        usuario,
        usuarioId: parsedParams.data.id,
        ativo: payload.ativo as boolean,
      });

      return NextResponse.json({ data }, { status: 200 });
    }

    const data = await updateUsuarioUseCase().execute({
      usuario,
      usuarioId: parsedParams.data.id,
      ...payload,
    });

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

    const data = await toggleUsuarioAtivoUseCase().execute({
      usuario,
      usuarioId: parsedParams.data.id,
      ativo: false,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
