import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { createDocumentoUseCase, listDocumentosByPostoUseCase } from '@/lib/container';
import { handleApiError, validationErrorResponse } from '@/lib/handle-api-error';

const createDocumentoSchema = z.object({
  postoId: z.string().uuid(),
  categoriaId: z.string().uuid(),
  titulo: z.string().trim().min(1).max(200),
  numero: z.string().trim().min(1).max(100).optional(),
  dataEmissao: z.coerce.date().optional(),
  dataVencimento: z.coerce.date().optional(),
  arquivoUrl: z.string().trim().min(1).optional(),
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

export async function GET(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const { searchParams } = new URL(request.url);
    const postoId = searchParams.get('postoId');

    if (!postoId) {
      return validationErrorResponse({ postoId: ['postoId é obrigatório'] });
    }

    const vencendoRaw = searchParams.get('vencendo');
    const vencendoParsed = vencendoRaw === null
      ? { success: true as const, data: undefined }
      : z.coerce.number().int().positive().safeParse(vencendoRaw);

    if (!vencendoParsed.success) {
      return validationErrorResponse(vencendoParsed.error.flatten());
    }

    const useCase = listDocumentosByPostoUseCase();
    const data = await useCase.execute({
      usuario,
      postoId,
      vencendoEmDias: vencendoParsed.data,
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
    const parsed = createDocumentoSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten());
    }

    const useCase = createDocumentoUseCase();
    const data = await useCase.execute({
      usuario,
      postoId: parsed.data.postoId,
      categoriaId: parsed.data.categoriaId,
      titulo: parsed.data.titulo,
      numero: parsed.data.numero,
      dataEmissao: parsed.data.dataEmissao,
      dataVencimento: parsed.data.dataVencimento,
      arquivoUrl: parsed.data.arquivoUrl,
    });

    revalidatePath('/documentos');

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
