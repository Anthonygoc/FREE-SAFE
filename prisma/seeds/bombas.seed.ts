import type { PrismaClient, ProdutoCombustivel } from '@prisma/client';

const produtos: ProdutoCombustivel[][] = [
  ['ETANOL_HIDRATADO','GASOLINA_COMUM','DIESEL_S10','ETANOL_HIDRATADO','GASOLINA_COMUM','DIESEL_S10'],
  ['DIESEL_S10','ETANOL_HIDRATADO','GASOLINA_COMUM','DIESEL_S10','ETANOL_HIDRATADO','GASOLINA_COMUM'],
  ['GASOLINA_COMUM','DIESEL_S500','ETANOL_HIDRATADO','GASOLINA_COMUM','DIESEL_S500','ETANOL_HIDRATADO'],
];

export async function seedBombas(db: PrismaClient) {
  const postos = await db.posto.findMany({ select: { id: true, nome: true } });
  if (!postos.length) throw new Error('Nenhum posto encontrado.');

  await db.bico.deleteMany({});
  await db.bomba.deleteMany({});

  for (const posto of postos) {
    for (let bi = 0; bi < 3; bi++) {
      const bomba = await db.bomba.create({
        data: { postoId: posto.id, numero: bi + 1, ativo: true },
      });
      await db.bico.createMany({
        data: produtos[bi].map((produto, idx) => ({
          bombaId: bomba.id,
          numero: bi * 6 + idx + 1,
          produto,
          ativo: true,
        })),
      });
    }
  }

  console.log(`✅ Bombas e bicos inseridos para ${postos.length} postos`);
}
