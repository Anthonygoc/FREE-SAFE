import { PrismaClient } from '@prisma/client';

import { seedAdmin } from './admin.seed';
import { seedCursos } from './cursos.seed';
import { seedNR01 } from './nr01.seed';
import { seedPostos } from './postos.seed';

const db = new PrismaClient();

async function main() {
  await seedPostos(db);
  await seedCursos(db);
  await seedNR01(db);
  await seedAdmin(db);
}

main()
  .catch((error) => {
    console.error('Erro ao executar seeds:', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
