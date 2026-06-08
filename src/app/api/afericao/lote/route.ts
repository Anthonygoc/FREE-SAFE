import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError } from '@/domain/errors/domain.errors';
import { auth } from '@/lib/auth';
import { createAfericaoUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

const produtoSchema = z.enum([
  'GASOLINA_COMUM',
  'GASOLINA_ADITIVADA',
  'GASOLINA_PREMIUM',
  'ETANOL_HIDRATADO',
  'DIESEL_S10',
  'DIESEL_S500',
]);

const resultadoMlSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.number().min(-500).max(500).nullable().optional(),
);

const createAfericaoLoteSchema = z.object({
  postoId: z.string().uuid(),
  afericoes: z.array(z.object({
    bicoId: z.string().uuid(),
    produto: produtoSchema,
    bomba: z.number().int().positive(),
    bico: z.number().int().positive(),
    resultadoMl: resultadoMlSchema,
    observacoes: z.string().max(500).optional(),
    fotoUrl: z.string().optional(),
  })),
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

export async function POST(request: Request) {
  try {
    const session = await auth();
    const usuario = getUsuarioAutenticado(session);

    const body = await request.json();
    const parsed = createAfericaoLoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = createAfericaoUseCase();
    const resultados: Array<{
      bicoId: string;
      situacao: 'DENTRO_DA_LEGISLACAO' | 'FORA_DA_TOLERANCIA';
      dentro: boolean;
    }> = [];

    for (const afericao of parsed.data.afericoes) {
      if (afericao.resultadoMl == null) {
        continue;
      }

      const resultado = await useCase.execute({
        usuario,
        postoId: parsed.data.postoId,
        bicoId: afericao.bicoId,
        produto: afericao.produto,
        bomba: afericao.bomba,
        bico: afericao.bico,
        resultadoMl: afericao.resultadoMl,
        observacoes: afericao.observacoes,
        fotoUrl: afericao.fotoUrl,
      });

      resultados.push({
        bicoId: afericao.bicoId,
        situacao: resultado.situacao,
        dentro: resultado.dentro,
      });
    }

    return NextResponse.json({
      registradas: resultados.length,
      resultados,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
