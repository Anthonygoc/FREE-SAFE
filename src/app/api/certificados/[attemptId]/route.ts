import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { emitCertificadoUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

const attemptIdSchema = z.string().uuid();

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

export async function GET(_request: Request, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const { attemptId } = await context.params;
    const parsed = attemptIdSchema.safeParse(attemptId);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const pdfBuffer = await emitCertificadoUseCase().execute({
      usuario,
      attemptId: parsed.data,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificado-${parsed.data}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
