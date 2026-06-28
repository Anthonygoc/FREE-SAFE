import { NextResponse } from 'next/server';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { ListPostosUseCase } from '@/application/use-cases/postos/list-postos.use-case';
import { PostoPrismaRepository } from '@/infrastructure/database/prisma/repositories/posto.prisma-repository';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/handle-api-error';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'sessao_expirada',
          mensagem: 'Sua sessão expirou. Faça login novamente.',
        },
        { status: 401 },
      );
    }

    const usuario: UsuarioAutenticado = {
      id: session.user.id,
      nome: session.user.name ?? '',
      email: session.user.email ?? '',
      perfil: session.user.perfil as UsuarioAutenticado['perfil'],
      postoId: session.user.postoId,
    };

    const useCase = new ListPostosUseCase(new PostoPrismaRepository());
    const postos = await useCase.execute(usuario);

    return NextResponse.json({ data: postos }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
