import { PrismaClient } from '@prisma/client';
import { seedPostos } from './postos.seed';

const db = new PrismaClient();

async function main() {
  await seedPostos(db);
}

main()
  .catch((error) => {
    console.error('Erro ao executar seeds:', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
