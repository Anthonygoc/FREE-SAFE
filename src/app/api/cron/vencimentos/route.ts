import { NextResponse } from 'next/server';

import { notificarVencimentosUseCase } from '@/lib/container';
import { handleApiError } from '@/lib/handle-api-error';

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authorization = request.headers.get('authorization');

    if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          error: 'nao_autorizado',
          mensagem: 'Acesso não autorizado ao cron.',
        },
        { status: 401 },
      );
    }

    const data = await notificarVencimentosUseCase().execute();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
