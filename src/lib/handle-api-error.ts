import { NextResponse } from 'next/server';

import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';

export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof DomainError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
}
