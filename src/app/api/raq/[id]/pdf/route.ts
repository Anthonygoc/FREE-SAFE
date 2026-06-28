import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError, DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { emitRAQPdfUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

const idSchema = z.string().uuid();

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

    const { id } = await context.params;
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = emitRAQPdfUseCase();
    const pdfBuffer = await useCase.execute({
      usuario,
      raqId: parsed.data,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="raq-${parsed.data}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
