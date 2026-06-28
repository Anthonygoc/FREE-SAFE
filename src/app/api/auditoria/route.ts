import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { AUDIT_ACOES, AUDIT_RECURSOS } from '@/domain/entities/audit-log.entity';
import { AuthenticationError, DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/handle-api-error';
import { listAuditoriaUseCase } from '@/lib/container';

const listAuditoriaQuerySchema = z.object({
  postoId: z.string().uuid().optional(),
  usuarioId: z.string().uuid().optional(),
  recurso: z.enum(AUDIT_RECURSOS).optional(),
  acao: z.enum(AUDIT_ACOES).optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  pagina: z.coerce.number().int().positive().optional(),
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

function normalizarParam(value: string | null): string | undefined {
  if (value === null) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function normalizarInicioDoDia(date?: Date): Date | undefined {
  if (!date) {
    return undefined;
  }

  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

function normalizarFimDoDia(date?: Date): Date | undefined {
  if (!date) {
    return undefined;
  }

  const normalized = new Date(date);
  normalized.setUTCHours(23, 59, 59, 999);
  return normalized;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const { searchParams } = new URL(request.url);
    const parsed = listAuditoriaQuerySchema.safeParse({
      postoId: normalizarParam(searchParams.get('postoId')),
      usuarioId: normalizarParam(searchParams.get('usuarioId')),
      recurso: normalizarParam(searchParams.get('recurso')),
      acao: normalizarParam(searchParams.get('acao')),
      dataInicio: normalizarParam(searchParams.get('dataInicio')),
      dataFim: normalizarParam(searchParams.get('dataFim')),
      pagina: normalizarParam(searchParams.get('pagina')),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const data = await listAuditoriaUseCase().execute({
      usuario,
      postoId: parsed.data.postoId,
      usuarioId: parsed.data.usuarioId,
      recurso: parsed.data.recurso,
      acao: parsed.data.acao,
      dataInicio: normalizarInicioDoDia(parsed.data.dataInicio),
      dataFim: normalizarFimDoDia(parsed.data.dataFim),
      pagina: parsed.data.pagina,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
