import { NextResponse } from 'next/server';
import { z } from 'zod';

import { redefinirSenhaUseCase } from '@/lib/container';
import { handleApiError, validationErrorResponse } from '@/lib/handle-api-error';

const redefinirSenhaSchema = z.object({
  token: z.string().trim().min(1),
  novaSenha: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = redefinirSenhaSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten());
    }

    await redefinirSenhaUseCase().execute({
      token: parsed.data.token,
      novaSenha: parsed.data.novaSenha,
    });

    return NextResponse.json(
      { data: { message: 'Senha redefinida com sucesso' } },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
