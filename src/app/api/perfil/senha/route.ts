import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AuthenticationError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { alterarMinhaSenhaUseCase } from '@/lib/container';
import { handleApiError, validationErrorResponse } from '@/lib/handle-api-error';

const alterarMinhaSenhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Informe sua senha atual.'),
  novaSenha: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres.'),
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

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);
    const body = await request.json();

    const parsed = alterarMinhaSenhaSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten());
    }

    await alterarMinhaSenhaUseCase().execute({
      usuario,
      senhaAtual: parsed.data.senhaAtual,
      novaSenha: parsed.data.novaSenha,
    });

    return NextResponse.json({ data: { sucesso: true } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
