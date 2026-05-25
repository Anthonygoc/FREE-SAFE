import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedAdmin(db: PrismaClient) {
  const senhaHash = await bcrypt.hash('freesafe@2024', 10);

  await db.user.upsert({
    where: { email: 'admin@freesafe.com.br' },
    create: {
      nome: 'Administrador FREE SAFE',
      email: 'admin@freesafe.com.br',
      senhaHash,
      perfil: 'ADMIN',
      postoId: null,
      ativo: true,
    },
    update: {
      nome: 'Administrador FREE SAFE',
      senhaHash,
      perfil: 'ADMIN',
      postoId: null,
      ativo: true,
    },
  });

  console.log('✅ Usuário admin inserido/atualizado');
}
