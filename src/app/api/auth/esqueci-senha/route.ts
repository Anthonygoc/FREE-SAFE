import { NextResponse } from 'next/server';
import { z } from 'zod';

import { solicitarResetSenhaUseCase } from '@/lib/container';
import { handleApiError, validationErrorResponse } from '@/lib/handle-api-error';

const solicitarResetSenhaSchema = z.object({
  email: z.string().trim().email().max(200),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = solicitarResetSenhaSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten());
    }

    await solicitarResetSenhaUseCase().execute({
      email: parsed.data.email,
    });

    return NextResponse.json(
      { data: { message: 'Se o email existir, enviamos um link' } },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
