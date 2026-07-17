import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const total = await prisma.rAQ.count();
console.log('Total de RAQs no banco:', total);

if (total > 0) {
  const raqs = await prisma.rAQ.findMany({
    select: {
      id: true, produto: true, resultado: true,
      densidadeObservada: true, massa20c: true,
      faseAquosa: true, teorAlcoolico: true, criadoEm: true,
    },
    orderBy: { criadoEm: 'desc' },
    take: 20,
  });
  console.log('\nÚltimos registros:');
  raqs.forEach(r => console.log(
    ' ', r.criadoEm.toISOString().slice(0,10),
    '|', r.produto,
    '| dens:', r.densidadeObservada,
    '| massa20c:', r.massa20c,
    '| fase:', r.faseAquosa,
    '| teor:', r.teorAlcoolico,
    '|', r.resultado
  ));
  console.log('\n(NADA foi alterado — só leitura)');
}
await prisma.$disconnect();
