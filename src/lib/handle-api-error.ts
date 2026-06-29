import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import {
  AuthenticationError,
  DomainError,
  NotFoundError,
  UnauthorizedError,
} from '@/domain/errors/domain.errors';

type ErrorResponseBody = {
  error: string;
  mensagem: string;
  detalhes?: unknown;
};

function createErrorResponse(status: number, body: ErrorResponseBody) {
  return NextResponse.json(body, { status });
}

function getDuplicateMessage(target: Prisma.PrismaClientKnownRequestError['meta']) {
  const targetValue = target?.target;
  const normalizedTarget = Array.isArray(targetValue)
    ? targetValue.join(',').toLocaleLowerCase('pt-BR')
    : String(targetValue ?? '').toLocaleLowerCase('pt-BR');

  if (normalizedTarget.includes('cpf')) {
    return 'Este CPF já está cadastrado';
  }

  if (normalizedTarget.includes('email')) {
    return 'Este e-mail já está cadastrado';
  }

  if (normalizedTarget.includes('cnpj')) {
    return 'Este CNPJ já está cadastrado';
  }

  return 'Já existe um registro com esses dados';
}

export function validationErrorResponse(detalhes: unknown) {
  return createErrorResponse(422, {
    error: 'dados_invalidos',
    mensagem: 'Os dados enviados são inválidos.',
    detalhes,
  });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return validationErrorResponse(error.flatten());
  }

  if (error instanceof AuthenticationError) {
    return createErrorResponse(401, {
      error: 'sessao_expirada',
      mensagem: error.message,
    });
  }

  if (error instanceof UnauthorizedError) {
    return createErrorResponse(403, {
      error: 'sem_permissao',
      mensagem: error.message || 'Você não tem permissão para esta ação',
    });
  }

  if (error instanceof NotFoundError) {
    return createErrorResponse(404, {
      error: 'nao_encontrado',
      mensagem: error.message,
    });
  }

  if (error instanceof DomainError) {
    return createErrorResponse(400, {
      error: 'erro_de_dominio',
      mensagem: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return createErrorResponse(409, {
      error: 'registro_duplicado',
      mensagem: getDuplicateMessage(error.meta),
    });
  }

  console.error(error);
  return createErrorResponse(500, {
    error: 'erro_interno',
    mensagem: 'Ocorreu um erro inesperado. Tente novamente.',
  });
}
