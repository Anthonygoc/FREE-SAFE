import type { PrismaClient } from '@prisma/client';

export const postosSeed = [
  { nome: 'Free Rosendo', razaoSocial: 'Free Rosendo Combustíveis LTDA', cnpj: '00.000.001/0001-01', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free M.A.', razaoSocial: 'Free M.A. Combustíveis LTDA', cnpj: '00.000.002/0001-02', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Atacadão', razaoSocial: 'Free Atacadão Combustíveis LTDA', cnpj: '00.000.003/0001-03', cidade: 'Várzea Grande', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Vitória', razaoSocial: 'Free Vitória Combustíveis LTDA', cnpj: '00.000.004/0001-04', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Inovar', razaoSocial: 'Free Inovar Combustíveis LTDA', cnpj: '00.000.005/0001-05', cidade: 'Várzea Grande', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Realeza', razaoSocial: 'Free Realeza Combustíveis LTDA', cnpj: '00.000.006/0001-06', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free XV', razaoSocial: 'Free XV Combustíveis LTDA', cnpj: '00.000.007/0001-07', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free VEM', razaoSocial: 'Free VEM Combustíveis LTDA', cnpj: '00.000.008/0001-08', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Brauna', razaoSocial: 'Free Brauna Combustíveis LTDA', cnpj: '00.000.009/0001-09', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Foz', razaoSocial: 'Free Foz Combustíveis LTDA', cnpj: '00.000.010/0001-10', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Palmeiras', razaoSocial: 'Free Palmeiras Combustíveis LTDA', cnpj: '00.000.011/0001-11', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Torres', razaoSocial: 'Free Torres Combustíveis LTDA', cnpj: '00.000.012/0001-12', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Dakar', razaoSocial: 'Free Dakar Combustíveis LTDA', cnpj: '00.000.013/0001-13', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Viena', razaoSocial: 'Free Viena Combustíveis LTDA', cnpj: '00.000.014/0001-14', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Riviera', razaoSocial: 'Free Riviera Combustíveis LTDA', cnpj: '00.000.015/0001-15', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Alphaville', razaoSocial: 'Free Alphaville Combustíveis LTDA', cnpj: '00.000.016/0001-16', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Petro Chapadão', razaoSocial: 'Free Petro Chapadão Combustíveis LTDA', cnpj: '00.000.017/0001-17', cidade: 'Chapadão do Sul', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Point', razaoSocial: 'Free Point Combustíveis LTDA', cnpj: '00.000.018/0001-18', cidade: 'Cuiabá', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Lucas do Rio Verde', razaoSocial: 'Free Lucas Combustíveis LTDA', cnpj: '00.000.019/0001-19', cidade: 'Lucas do Rio Verde', uf: 'MT', endereco: 'A definir' },
];

export async function seedPostos(db: PrismaClient) {
  for (const posto of postosSeed) {
    await db.posto.upsert({
      where: { cnpj: posto.cnpj },
      create: posto,
      update: { nome: posto.nome, cidade: posto.cidade },
    });
  }

  console.log(`✅ ${postosSeed.length} postos inseridos/atualizados`);
}
