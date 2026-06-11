import type { PrismaClient } from '@prisma/client';

export const categoriasDocumentoIniciais = [
  'Contrato com Distribuidora',
  'Alvará de Funcionamento',
  'Certificado ANP',
  'Alvará do Bombeiro / AVCB',
  'Licença Ambiental / SEMA',
  'Croqui / Planta Baixa',
  'Inscrição Estadual',
  'CNPJ',
  'Outorga de Água',
];

export async function seedCategoriasDocumento(db: PrismaClient) {
  for (const nome of categoriasDocumentoIniciais) {
    await db.categoriaDocumento.upsert({
      where: { nome },
      create: { nome },
      update: {},
    });
  }

  console.log(`✅ ${categoriasDocumentoIniciais.length} categorias de documento inseridas/atualizadas`);
}
