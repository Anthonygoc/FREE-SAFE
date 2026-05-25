import { NextResponse } from 'next/server';
import { z } from 'zod';

import { DomainError } from '@/domain/errors/domain.errors';
import { RAQPrismaRepository } from '@/infrastructure/database/prisma/repositories/raq.prisma-repository';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/handle-api-error';

const idSchema = z.string().uuid();

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new DomainError('Não autenticado');
    }

    const { id } = await context.params;
    const parsedId = idSchema.parse(id);

    const repo = new RAQPrismaRepository();
    const raq = await repo.buscarPorId(parsedId);

    if (!raq) {
      return NextResponse.json({ error: 'RAQ não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ data: raq }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parâmetro inválido', details: error.issues }, { status: 400 });
    }

    return handleApiError(error);
  }
}
