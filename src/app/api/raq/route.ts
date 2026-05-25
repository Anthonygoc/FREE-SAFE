import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { createRAQUseCase, listRAQByPostoUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

const produtoSchema = z.enum([
  'GASOLINA_COMUM',
  'GASOLINA_ADITIVADA',
  'GASOLINA_PREMIUM',
  'ETANOL_HIDRATADO',
  'DIESEL_S10',
  'DIESEL_S500',
]);

const resultadoSchema = z.enum(['APROVADO', 'REPROVADO']);
const aspectoSchema = z.enum(['LIQUIDO_E_ISENTO', 'TURVO', 'COM_IMPUREZAS']);
const corSchema = z.enum(['CARACTERISTICA', 'ALTERADA']);

const createRAQSchema = z.object({
  postoId: z.string().uuid(),
  produto: produtoSchema,
  temperaturaObservada: z.number(),
  densidadeObservada: z.number(),
  aspecto: aspectoSchema,
  cor: corSchema,
  faseAquosa: z.number().optional(),
  teorAlcoolico: z.number().optional(),
  distribuidora: z.string().optional(),
  notaFiscal: z.string().optional(),
  placaCaminhao: z.string().optional(),
  tanqueDestino: z.string().optional(),
});

function getUsuarioAutenticado(session: Awaited<ReturnType<typeof auth>>): UsuarioAutenticado {
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

export async function GET(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const { searchParams } = new URL(request.url);
    const postoId = searchParams.get('postoId');

    if (!postoId) {
      return NextResponse.json({ error: 'postoId é obrigatório' }, { status: 400 });
    }

    const produtoRaw = searchParams.get('produto');
    const resultadoRaw = searchParams.get('resultado');
    const dataInicioRaw = searchParams.get('dataInicio');
    const dataFimRaw = searchParams.get('dataFim');

    const produto = produtoRaw ? produtoSchema.parse(produtoRaw) : undefined;
    const resultado = resultadoRaw ? resultadoSchema.parse(resultadoRaw) : undefined;
    const dataInicio = dataInicioRaw ? z.coerce.date().parse(dataInicioRaw) : undefined;
    const dataFim = dataFimRaw ? z.coerce.date().parse(dataFimRaw) : undefined;

    const useCase = listRAQByPostoUseCase();
    const data = await useCase.execute({
      usuario,
      postoId,
      produto,
      resultado,
      dataInicio,
      dataFim,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parâmetros inválidos', details: error.issues }, { status: 400 });
    }

    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);
    const body = await request.json();

    const input = createRAQSchema.parse(body);

    const useCase = createRAQUseCase();
    const data = await useCase.execute({
      usuario,
      ...input,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Payload inválido', details: error.issues }, { status: 400 });
    }

    return handleApiError(error);
  }
}
