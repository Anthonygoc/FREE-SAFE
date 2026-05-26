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
  volumeRecebido: z.number().positive().optional(),
  temperaturaObservada: z.number(),
  densidadeObservada: z.number(),
  massa20c: z.number().optional(),
  aspecto: aspectoSchema,
  cor: corSchema,
  faseAquosa: z.number().optional(),
  teorEtanol: z.number().optional(),
  teorAlcoolico: z.number().optional(),
  distribuidora: z.string().optional(),
  cnpjDistribuidora: z.string().max(18).optional(),
  transportador: z.string().max(150).optional(),
  cnpjTransportador: z.string().max(18).optional(),
  notaFiscal: z.string().optional(),
  placaCaminhao: z.string().optional(),
  nomeMotorista: z.string().max(150).optional(),
  cpfMotorista: z.string().max(14).optional(),
  tanqueDestino: z.string().optional(),
  nomeAnalista: z.string().max(150).optional(),
});

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

    const produto = parseOptionalQueryParam(produtoSchema, produtoRaw);
    if (!produto.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: produto.error.flatten() },
        { status: 422 },
      );
    }

    const resultado = parseOptionalQueryParam(resultadoSchema, resultadoRaw);
    if (!resultado.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: resultado.error.flatten() },
        { status: 422 },
      );
    }

    const dataInicio = parseOptionalQueryParam(z.coerce.date(), dataInicioRaw);
    if (!dataInicio.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: dataInicio.error.flatten() },
        { status: 422 },
      );
    }

    const dataFim = parseOptionalQueryParam(z.coerce.date(), dataFimRaw);
    if (!dataFim.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: dataFim.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = listRAQByPostoUseCase();
    const data = await useCase.execute({
      usuario,
      postoId,
      produto: produto.data,
      resultado: resultado.data,
      dataInicio: dataInicio.data,
      dataFim: dataFim.data,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);
    const body = await request.json();

    const parsed = createRAQSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = createRAQUseCase();
    const data = await useCase.execute({
      usuario,
      ...parsed.data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

function parseOptionalQueryParam<TSchema extends z.ZodTypeAny>(schema: TSchema, value: string | null) {
  if (value === null) {
    return { success: true as const, data: undefined as z.infer<TSchema> | undefined };
  }

  return schema.safeParse(value);
}
