import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { getPostoByIdUseCase, updatePostoUseCase } from '@/lib/container';
import { handleApiError, validationErrorResponse } from '@/lib/handle-api-error';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const updatePostoSchema = z.object({
  nome: z.string().trim().min(1).max(100).optional(),
  razaoSocial: z.string().trim().min(1).max(200).optional(),
  inscricaoEstadual: z.string().trim().max(30).nullish(),
  endereco: z.string().trim().min(1).max(300).optional(),
  cidade: z.string().trim().min(1).max(100).optional(),
  uf: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
  logoUrl: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().trim().min(1).optional(),
  ),
  maxGerentes: z.coerce.number().int().min(0).optional(),
  maxAdministrativos: z.coerce.number().int().min(0).optional(),
  toleranciaInmetroMl: z.coerce.number().int().min(1).max(1000).optional(),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'Informe pelo menos um campo para atualização' },
);

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

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const params = await context.params;
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return validationErrorResponse(parsedParams.error.flatten());
    }

    const data = await getPostoByIdUseCase().execute({
      usuario,
      postoId: parsedParams.data.id,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const params = await context.params;
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return validationErrorResponse(parsedParams.error.flatten());
    }

    const body = await request.json();
    const parsedBody = updatePostoSchema.safeParse(body);

    if (!parsedBody.success) {
      return validationErrorResponse(parsedBody.error.flatten());
    }

    const data = await updatePostoUseCase().execute({
      usuario,
      postoId: parsedParams.data.id,
      ...parsedBody.data,
      inscricaoEstadual: parsedBody.data.inscricaoEstadual === undefined
        ? undefined
        : parsedBody.data.inscricaoEstadual || null,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
