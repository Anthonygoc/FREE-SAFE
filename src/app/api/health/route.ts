import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const user = await prisma.user.findUnique({ 
      where: { email: 'admin@freesafe.com.br' } 
    });
    return NextResponse.json({ 
      ok: true, 
      userCount,
      adminExists: !!user,
      adminAtivo: user?.ativo,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
