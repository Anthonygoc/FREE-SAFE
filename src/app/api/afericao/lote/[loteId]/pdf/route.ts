import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { buildReportFileName } from '@/lib/report-file-name';
import { emitAfericaoPdfUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

const loteIdSchema = z.string().uuid();

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

export async function GET(_request: Request, context: { params: Promise<{ loteId: string }> }) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const { loteId } = await context.params;
    const parsed = loteIdSchema.safeParse(loteId);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = emitAfericaoPdfUseCase();
    const output = await useCase.execute({
      usuario,
      loteId: parsed.data,
    });

    return new NextResponse(new Uint8Array(output.buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${buildReportFileName('Afericao', output.postoNome, output.dataReferencia, 'pdf')}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
