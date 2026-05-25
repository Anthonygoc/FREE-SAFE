<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---
name: free-safe-database
description: Use esta skill ao criar ou modificar o schema Prisma, repositórios, mappers ou seeds do FREE SAFE. Cobre todas as tabelas, relações, convenções de nomenclatura e o padrão de mapper entre modelo Prisma e entidade de domínio.
---

# FREE SAFE — Banco de dados (Prisma + PostgreSQL)

## Schema Prisma completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ────────────────────────────────────────────

enum PerfilUsuario {
  ADMIN
  GERENTE
  RH
  COLABORADOR
  MANUTENCAO
}

enum StatusColaborador {
  ATIVO
  AFASTADO
  DESLIGADO
}

enum ProdutoCombustivel {
  GASOLINA_COMUM
  GASOLINA_ADITIVADA
  GASOLINA_PREMIUM
  ETANOL_HIDRATADO
  DIESEL_S10
  DIESEL_S500
}

enum ResultadoAnalise {
  APROVADO
  REPROVADO
}

enum AspectoCombustivel {
  LIQUIDO_E_ISENTO
  TURVO
  COM_IMPUREZAS
}

enum SituacaoAfericao {
  DENTRO_DA_LEGISLACAO
  FORA_DA_TOLERANCIA
}

enum TipoEntrevista {
  ADMISSAO
  INTEGRACAO
  TRINTA_DIAS
  EXPERIENCIA
  PERIODICA
  OCORRENCIA
  RETORNO
  DESLIGAMENTO
}

enum TipoDocumento {
  AUTORIZACAO_ANP
  CONTRATO_DISTRIBUIDORA
  ALVARA_FUNCIONAMENTO
  ALVARA_SANITARIO
  LICENCA_AMBIENTAL
  AVCB_BOMBEIROS
  INMETRO_IPEM
  CNPJ
  INSCRICAO_ESTADUAL
  FISPQ
  PARECER_TECNICO
  OUTORGA
  PLANTA_BAIXA
  FOTO_FACHADA
}

enum StatusDocumento {
  VALIDO
  VENCENDO
  VENCIDO
}

enum TipoManutencao {
  PREVENTIVA
  CORRETIVA
  EMERGENCIAL
}

enum StatusManutencao {
  ABERTA
  EM_ANDAMENTO
  CONCLUIDA
  CANCELADA
}

// ─── Modelos ──────────────────────────────────────────

model User {
  id         String        @id @default(uuid())
  nome       String        @db.VarChar(150)
  email      String        @unique @db.VarChar(200)
  senhaHash  String        @map("senha_hash")
  perfil     PerfilUsuario @default(COLABORADOR)
  postoId    String?       @map("posto_id")
  ativo      Boolean       @default(true)
  criadoEm  DateTime      @default(now()) @map("criado_em")
  atualizadoEm DateTime   @updatedAt @map("atualizado_em")

  posto        Posto?        @relation(fields: [postoId], references: [id])
  raqsCriadas  RAQ[]
  entrevistas  Entrevista[]
  colaborador  Colaborador?

  @@map("users")
}

model Posto {
  id           String  @id @default(uuid())
  nome         String  @db.VarChar(100)
  razaoSocial  String  @map("razao_social") @db.VarChar(200)
  cnpj         String  @unique @db.VarChar(18)
  inscricaoEstadual String? @map("inscricao_estadual") @db.VarChar(30)
  endereco     String  @db.VarChar(300)
  cidade       String  @db.VarChar(100)
  uf           String  @db.Char(2)
  gerenteId    String? @map("gerente_id")
  ativo        Boolean @default(true)
  criadoEm    DateTime @default(now()) @map("criado_em")
  atualizadoEm DateTime @updatedAt @map("atualizado_em")

  gerente       User?          @relation(fields: [gerenteId], references: [id])
  colaboradores Colaborador[]
  raqs          RAQ[]
  afericoes     Afericao[]
  documentos    Documento[]
  manutencoes   Manutencao[]
  drenagens     Drenagem[]
  users         User[]

  @@map("postos")
}

model Colaborador {
  id            String            @id @default(uuid())
  postoId       String            @map("posto_id")
  userId        String?           @unique @map("user_id")
  nome          String            @db.VarChar(150)
  cpf           String            @unique @db.VarChar(14)
  rg            String?           @db.VarChar(20)
  telefone      String?           @db.VarChar(20)
  email         String?           @db.VarChar(200)
  endereco      String?           @db.VarChar(300)
  cargo         String            @db.VarChar(80)
  dataAdmissao  DateTime          @map("data_admissao") @db.Date
  turno         String?           @db.VarChar(30)
  escala        String?           @db.VarChar(30)
  status        StatusColaborador @default(ATIVO)
  criadoEm     DateTime           @default(now()) @map("criado_em")
  atualizadoEm DateTime           @updatedAt @map("atualizado_em")

  posto        Posto         @relation(fields: [postoId], references: [id])
  user         User?         @relation(fields: [userId], references: [id])
  treinamentos TreinamentoColaborador[]
  entrevistas  Entrevista[]

  @@map("colaboradores")
}

model Curso {
  id               String   @id @default(uuid())
  nome             String   @db.VarChar(150)
  descricao        String?  @db.Text
  cargaHoraria     Int?     @map("carga_horaria")
  validadeDias     Int?     @map("validade_dias")
  cargosObrigatorios String[] @map("cargos_obrigatorios")
  ativo            Boolean  @default(true)
  criadoEm        DateTime  @default(now()) @map("criado_em")

  treinamentos TreinamentoColaborador[]

  @@map("cursos")
}

model TreinamentoColaborador {
  id              String   @id @default(uuid())
  colaboradorId   String   @map("colaborador_id")
  cursoId         String   @map("curso_id")
  status          String   @db.VarChar(30) // PENDENTE | EM_ANDAMENTO | CONCLUIDO
  nota            Float?
  dataConclusao   DateTime? @map("data_conclusao") @db.Date
  certificadoUrl  String?  @map("certificado_url") @db.VarChar(500)
  criadoEm       DateTime  @default(now()) @map("criado_em")

  colaborador Colaborador @relation(fields: [colaboradorId], references: [id])
  curso       Curso       @relation(fields: [cursoId], references: [id])

  @@unique([colaboradorId, cursoId])
  @@map("treinamentos_colaborador")
}

model Entrevista {
  id                    String         @id @default(uuid())
  colaboradorId         String         @map("colaborador_id")
  postoId               String         @map("posto_id")
  responsavelId         String         @map("responsavel_id")
  tipo                  TipoEntrevista
  data                  DateTime       @db.Date
  respostas             Json?
  observacoes           String?        @db.Text
  compromissoColaborador String?       @map("compromisso_colaborador") @db.Text
  assinaturaColaboradorUrl String?     @map("assinatura_colaborador_url") @db.VarChar(500)
  assinaturaResponsavelUrl String?     @map("assinatura_responsavel_url") @db.VarChar(500)
  criadoEm             DateTime        @default(now()) @map("criado_em")

  colaborador  Colaborador @relation(fields: [colaboradorId], references: [id])
  responsavel  User        @relation(fields: [responsavelId], references: [id])

  @@map("entrevistas")
}

model RAQ {
  id                   String             @id @default(uuid())
  postoId              String             @map("posto_id")
  responsavelId        String             @map("responsavel_id")
  produto              ProdutoCombustivel
  data                 DateTime           @default(now()) @db.Timestamptz
  temperaturaObservada Float              @map("temperatura_observada")
  densidadeObservada   Float              @map("densidade_observada")
  massa20c             Float?             @map("massa_20c")
  aspecto              AspectoCombustivel
  cor                  String             @db.VarChar(30)
  faseAquosa           Float?             @map("fase_aquosa")
  teorEtanol           Float?             @map("teor_etanol")
  teorAlcoolico        Float?             @map("teor_alcoolico")
  resultado            ResultadoAnalise
  boletimUrl           String?            @map("boletim_url") @db.VarChar(500)
  fotoProvetaUrl       String?            @map("foto_proveta_url") @db.VarChar(500)
  fotoAmostraUrl       String?            @map("foto_amostra_url") @db.VarChar(500)
  distribuidora        String?            @db.VarChar(100)
  notaFiscal           String?            @map("nota_fiscal") @db.VarChar(50)
  placaCaminhao        String?            @map("placa_caminhao") @db.VarChar(10)
  tanqueDestino        String?            @map("tanque_destino") @db.VarChar(50)
  pdfUrl               String?            @map("pdf_url") @db.VarChar(500)
  criadoEm            DateTime            @default(now()) @map("criado_em")

  posto       Posto @relation(fields: [postoId], references: [id])
  responsavel User  @relation(fields: [responsavelId], references: [id])

  @@map("raqs")
}

model Afericao {
  id             String           @id @default(uuid())
  postoId        String           @map("posto_id")
  responsavelId  String           @map("responsavel_id")
  produto        ProdutoCombustivel
  bomba          Int
  bico           Int
  medidaPadrao   Float            @map("medida_padrao") @default(20)
  resultadoMl    Float            @map("resultado_ml")
  situacao       SituacaoAfericao
  observacoes    String?          @db.Text
  fotosUrls      String[]         @map("fotos_urls")
  relatorioUrl   String?          @map("relatorio_url") @db.VarChar(500)
  data           DateTime         @default(now()) @db.Timestamptz
  criadoEm      DateTime          @default(now()) @map("criado_em")

  posto       Posto @relation(fields: [postoId], references: [id])

  @@map("afericoes")
}

model Documento {
  id             String          @id @default(uuid())
  postoId        String          @map("posto_id")
  tipo           TipoDocumento
  numero         String?         @db.VarChar(100)
  dataEmissao    DateTime?       @map("data_emissao") @db.Date
  dataVencimento DateTime?       @map("data_vencimento") @db.Date
  arquivoUrl     String?         @map("arquivo_url") @db.VarChar(500)
  status         StatusDocumento @default(VALIDO)
  criadoEm      DateTime         @default(now()) @map("criado_em")
  atualizadoEm  DateTime         @updatedAt @map("atualizado_em")

  posto Posto @relation(fields: [postoId], references: [id])

  @@map("documentos")
}

model Manutencao {
  id             String           @id @default(uuid())
  postoId        String           @map("posto_id")
  equipamento    String           @db.VarChar(100)
  tipo           TipoManutencao
  descricao      String           @db.Text
  status         StatusManutencao @default(ABERTA)
  responsavel    String           @db.VarChar(150)
  dataAbertura   DateTime         @map("data_abertura") @default(now()) @db.Date
  dataFechamento DateTime?        @map("data_fechamento") @db.Date
  fotosUrls      String[]         @map("fotos_urls")
  criadoEm      DateTime          @default(now()) @map("criado_em")
  atualizadoEm  DateTime          @updatedAt @map("atualizado_em")

  posto Posto @relation(fields: [postoId], references: [id])

  @@map("manutencoes")
}

model Drenagem {
  id            String   @id @default(uuid())
  postoId       String   @map("posto_id")
  tanque        String   @db.VarChar(50)
  produto       ProdutoCombustivel
  data          DateTime @db.Date
  responsavel   String   @db.VarChar(150)
  resultado     String?  @db.VarChar(200)
  observacoes   String?  @db.Text
  fotosUrls     String[] @map("fotos_urls")
  criadoEm     DateTime  @default(now()) @map("criado_em")

  posto Posto @relation(fields: [postoId], references: [id])

  @@map("drenagens")
}
```

## Padrão de repositório Prisma

```typescript
// src/infrastructure/database/prisma/repositories/raq.prisma-repository.ts

import type { PrismaClient } from '@prisma/client';
import type { RAQRepository, FiltrosRAQ } from '@/domain/ports/raq.repository';
import { RAQ } from '@/domain/entities/raq.entity';
import { RAQMapper } from '@/infrastructure/database/mappers/raq.mapper';
import { NotFoundError } from '@/domain/errors/domain.errors';

export class RAQPrismaRepository implements RAQRepository {
  constructor(private readonly db: PrismaClient) {}

  async salvar(raq: RAQ): Promise<void> {
    await this.db.rAQ.upsert({
      where: { id: raq.id },
      create: RAQMapper.toPrisma(raq),
      update: RAQMapper.toPrisma(raq),
    });
  }

  async buscarPorId(id: string): Promise<RAQ | null> {
    const raw = await this.db.rAQ.findUnique({ where: { id } });
    if (!raw) return null;
    return RAQMapper.toDomain(raw);
  }

  async listar(filtros: FiltrosRAQ): Promise<RAQ[]> {
    const registros = await this.db.rAQ.findMany({
      where: {
        ...(filtros.postoId && { postoId: filtros.postoId }),
        ...(filtros.produto && { produto: filtros.produto as any }),
        ...(filtros.resultado && { resultado: filtros.resultado as any }),
        ...(filtros.dataInicio || filtros.dataFim
          ? {
              data: {
                ...(filtros.dataInicio && { gte: filtros.dataInicio }),
                ...(filtros.dataFim && { lte: filtros.dataFim }),
              },
            }
          : {}),
      },
      orderBy: { data: 'desc' },
    });
    return registros.map(RAQMapper.toDomain);
  }

  async contarPorPosto(postoId: string): Promise<number> {
    return this.db.rAQ.count({ where: { postoId } });
  }

  async contarSemBoletim(): Promise<number> {
    return this.db.rAQ.count({ where: { boletimUrl: null } });
  }
}
```

## Padrão de mapper

```typescript
// src/infrastructure/database/mappers/raq.mapper.ts

import type { RAQ as PrismaRAQ } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { RAQ } from '@/domain/entities/raq.entity';

export class RAQMapper {
  static toDomain(raw: PrismaRAQ): RAQ {
    return RAQ.reconstituir({
      id:                  raw.id,
      postoId:             raw.postoId,
      responsavelId:       raw.responsavelId,
      produto:             raw.produto as any,
      temperaturaObservada: raw.temperaturaObservada,
      densidadeObservada:  raw.densidadeObservada,
      aspecto:             raw.aspecto as any,
      cor:                 raw.cor as any,
      faseAquosa:          raw.faseAquosa ?? undefined,
      teorAlcoolico:       raw.teorAlcoolico ?? undefined,
      distribuidora:       raw.distribuidora ?? undefined,
      notaFiscal:          raw.notaFiscal ?? undefined,
      placaCaminhao:       raw.placaCaminhao ?? undefined,
      tanqueDestino:       raw.tanqueDestino ?? undefined,
      resultado:           raw.resultado as any,
      boletimUrl:          raw.boletimUrl ?? undefined,
      fotoProvetaUrl:      raw.fotoProvetaUrl ?? undefined,
      criadoEm:            raw.criadoEm,
    });
  }

  static toPrisma(raq: RAQ): Prisma.RAQCreateInput {
    return {
      id:                  raq.id,
      posto:               { connect: { id: raq.postoId } },
      responsavel:         { connect: { id: raq.responsavelId } },
      produto:             raq.produto,
      temperaturaObservada: raq.temperaturaObservada,
      densidadeObservada:  raq.densidadeObservada,
      aspecto:             raq.aspecto,
      cor:                 raq.cor,
      faseAquosa:          raq.faseAquosa ?? null,
      teorAlcoolico:       raq.teorAlcoolico ?? null,
      distribuidora:       raq.distribuidora ?? null,
      notaFiscal:          raq.notaFiscal ?? null,
      placaCaminhao:       raq.placaCaminhao ?? null,
      tanqueDestino:       raq.tanqueDestino ?? null,
      resultado:           raq.resultado,
      boletimUrl:          raq.boletimUrl ?? null,
      fotoProvetaUrl:      raq.fotoProvetaUrl ?? null,
      criadoEm:            raq.criadoEm,
    };
  }
}
```

## Seed dos 19 postos

```typescript
// prisma/seeds/postos.seed.ts

import type { PrismaClient } from '@prisma/client';

export const postosSeed = [
  { nome: 'Free Rosendo',          razaoSocial: 'Free Rosendo Combustíveis LTDA',      cnpj: '00.000.001/0001-01', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free M.A.',             razaoSocial: 'Free M.A. Combustíveis LTDA',         cnpj: '00.000.002/0001-02', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Atacadão',         razaoSocial: 'Free Atacadão Combustíveis LTDA',     cnpj: '00.000.003/0001-03', cidade: 'Várzea Grande',       uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Vitória',          razaoSocial: 'Free Vitória Combustíveis LTDA',      cnpj: '00.000.004/0001-04', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Inovar',           razaoSocial: 'Free Inovar Combustíveis LTDA',       cnpj: '00.000.005/0001-05', cidade: 'Várzea Grande',       uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Realeza',          razaoSocial: 'Free Realeza Combustíveis LTDA',      cnpj: '00.000.006/0001-06', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free XV',               razaoSocial: 'Free XV Combustíveis LTDA',           cnpj: '00.000.007/0001-07', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free VEM',              razaoSocial: 'Free VEM Combustíveis LTDA',          cnpj: '00.000.008/0001-08', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Brauna',           razaoSocial: 'Free Brauna Combustíveis LTDA',       cnpj: '00.000.009/0001-09', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Foz',              razaoSocial: 'Free Foz Combustíveis LTDA',          cnpj: '00.000.010/0001-10', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Palmeiras',        razaoSocial: 'Free Palmeiras Combustíveis LTDA',    cnpj: '00.000.011/0001-11', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Torres',           razaoSocial: 'Free Torres Combustíveis LTDA',       cnpj: '00.000.012/0001-12', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Dakar',            razaoSocial: 'Free Dakar Combustíveis LTDA',        cnpj: '00.000.013/0001-13', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Viena',            razaoSocial: 'Free Viena Combustíveis LTDA',        cnpj: '00.000.014/0001-14', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Riviera',          razaoSocial: 'Free Riviera Combustíveis LTDA',      cnpj: '00.000.015/0001-15', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Alphaville',       razaoSocial: 'Free Alphaville Combustíveis LTDA',   cnpj: '00.000.016/0001-16', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Petro Chapadão',   razaoSocial: 'Free Petro Chapadão Combustíveis LTDA', cnpj: '00.000.017/0001-17', cidade: 'Chapadão do Sul', uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Point',            razaoSocial: 'Free Point Combustíveis LTDA',        cnpj: '00.000.018/0001-18', cidade: 'Cuiabá',              uf: 'MT', endereco: 'A definir' },
  { nome: 'Free Lucas do Rio Verde', razaoSocial: 'Free Lucas Combustíveis LTDA',     cnpj: '00.000.019/0001-19', cidade: 'Lucas do Rio Verde',  uf: 'MT', endereco: 'A definir' },
];

export async function seedPostos(db: PrismaClient) {
  for (const posto of postosSeed) {
    await db.posto.upsert({
      where:  { cnpj: posto.cnpj },
      create: posto,
      update: { nome: posto.nome, cidade: posto.cidade },
    });
  }
  console.log(`✅ ${postosSeed.length} postos inseridos/atualizados`);
}
```

## Regras que o Codex deve seguir nesta camada

1. Campos em `snake_case` no banco, `camelCase` no TypeScript — sempre usar `@map()`
2. Relações sempre com `@relation` explícito — sem relações implícitas
3. `upsert` em vez de `create` nos repositórios — idempotência
4. Mapper nunca acessa banco — só converte tipos
5. Nunca usar `prisma.xyz` direto nos casos de uso — sempre via repositório
6. `null` do banco vira `undefined` no domínio — mapper faz a conversão com `?? undefined`
7. `undefined` do domínio vira `null` no banco — mapper faz a conversão com `?? null`
8. Queries de listagem sempre com `orderBy` explícito
9. Seed usa `upsert` — pode rodar múltiplas vezes sem erro




---
name: free-safe-domain
description: Use esta skill sempre que for criar entidades, value objects, ports ou erros de domínio do FREE SAFE. Cobre a camada mais interna da arquitetura hexagonal: sem imports externos, sem Prisma, sem framework.
---

# FREE SAFE — Camada de Domínio

## Regra absoluta

O domínio não importa nada externo. Zero imports de Prisma, Next.js, Zod, Supabase ou qualquer biblioteca.
Se você se pegar importando algo que não seja outro arquivo de `src/domain/`, pare e mova a lógica.

## Estrutura de pastas

```
src/domain/
├── entities/
│   ├── raq.entity.ts
│   ├── colaborador.entity.ts
│   ├── posto.entity.ts
│   ├── afericao.entity.ts
│   ├── treinamento.entity.ts
│   └── documento.entity.ts
├── value-objects/
│   ├── cpf.vo.ts
│   ├── produto-combustivel.vo.ts
│   ├── resultado-analise.vo.ts
│   └── perfil-usuario.vo.ts
├── errors/
│   └── domain.errors.ts
└── ports/
    ├── raq.repository.ts
    ├── colaborador.repository.ts
    ├── posto.repository.ts
    ├── afericao.repository.ts
    ├── treinamento.repository.ts
    ├── documento.repository.ts
    ├── storage.port.ts
    ├── pdf.port.ts
    └── email.port.ts
```

## Padrão de entidade

Toda entidade segue este padrão exato:

```typescript
// src/domain/entities/raq.entity.ts

export type ProdutoCombustivel =
  | 'GASOLINA_COMUM'
  | 'GASOLINA_ADITIVADA'
  | 'GASOLINA_PREMIUM'
  | 'ETANOL_HIDRATADO'
  | 'DIESEL_S10'
  | 'DIESEL_S500';

export type ResultadoAnalise = 'APROVADO' | 'REPROVADO';

export type AspectoCombustivel = 'LIQUIDO_E_ISENTO' | 'TURVO' | 'COM_IMPUREZAS';

export interface CriarRAQProps {
  postoId: string;
  responsavelId: string;
  produto: ProdutoCombustivel;
  temperaturaObservada: number;
  densidadeObservada: number;
  aspecto: AspectoCombustivel;
  cor: 'CARACTERISTICA' | 'ALTERADA';
  faseAquosa?: number;        // gasolina
  teorAlcoolico?: number;     // etanol
  distribuidora?: string;
  notaFiscal?: string;
  placaCaminhao?: string;
  tanqueDestino?: string;
}

export interface ReconstituirRAQProps extends CriarRAQProps {
  id: string;
  resultado: ResultadoAnalise;
  boletimUrl?: string;
  fotoProvetaUrl?: string;
  criadoEm: Date;
}

export class RAQ {
  readonly id: string;
  readonly postoId: string;
  readonly responsavelId: string;
  readonly produto: ProdutoCombustivel;
  readonly temperaturaObservada: number;
  readonly densidadeObservada: number;
  readonly aspecto: AspectoCombustivel;
  readonly cor: 'CARACTERISTICA' | 'ALTERADA';
  readonly faseAquosa?: number;
  readonly teorAlcoolico?: number;
  readonly distribuidora?: string;
  readonly notaFiscal?: string;
  readonly placaCaminhao?: string;
  readonly tanqueDestino?: string;
  readonly resultado: ResultadoAnalise;
  readonly boletimUrl?: string;
  readonly fotoProvetaUrl?: string;
  readonly criadoEm: Date;

  private constructor(props: ReconstituirRAQProps) {
    Object.assign(this, props);
  }

  // Factory para criação nova — calcula resultado
  static criar(props: CriarRAQProps): RAQ {
    if (!props.postoId) throw new CampoObrigatorioError('postoId');
    if (!props.responsavelId) throw new CampoObrigatorioError('responsavelId');

    const resultado = RAQ.calcularResultado(props);

    return new RAQ({
      ...props,
      id: crypto.randomUUID(),
      resultado,
      criadoEm: new Date(),
    });
  }

  // Factory para reconstituir do banco — não recalcula
  static reconstituir(props: ReconstituirRAQProps): RAQ {
    return new RAQ(props);
  }

  get estaAprovado(): boolean {
    return this.resultado === 'APROVADO';
  }

  // Regras ANP — únicas responsáveis pelo resultado
  private static calcularResultado(props: CriarRAQProps): ResultadoAnalise {
    // Pré-requisito: aspecto e cor
    if (props.aspecto !== 'LIQUIDO_E_ISENTO' || props.cor !== 'CARACTERISTICA') {
      return 'REPROVADO';
    }

    switch (props.produto) {
      case 'GASOLINA_COMUM':
      case 'GASOLINA_ADITIVADA':
        return RAQ.avaliarGasolina(props.faseAquosa, 29, 31);
      case 'GASOLINA_PREMIUM':
        return RAQ.avaliarGasolina(props.faseAquosa, 24, 26);
      case 'ETANOL_HIDRATADO':
        return RAQ.avaliarEtanol(props.teorAlcoolico);
      case 'DIESEL_S10':
        return RAQ.avaliarDiesel(props.densidadeObservada, 0.815, 0.853);
      case 'DIESEL_S500':
        return RAQ.avaliarDiesel(props.densidadeObservada, 0.815, 0.865);
      default:
        return 'REPROVADO';
    }
  }

  // Fórmula ANP: teor (%) = ((faseAquosa - 50) × 2) + 1
  private static avaliarGasolina(
    faseAquosa: number | undefined,
    min: number,
    max: number,
  ): ResultadoAnalise {
    if (faseAquosa === undefined || isNaN(faseAquosa)) return 'REPROVADO';
    const teor = ((faseAquosa - 50) * 2) + 1;
    return teor >= min && teor <= max ? 'APROVADO' : 'REPROVADO';
  }

  // Faixa ANP: 92,5 a 95,4 INPM
  private static avaliarEtanol(teorAlcoolico: number | undefined): ResultadoAnalise {
    if (teorAlcoolico === undefined || isNaN(teorAlcoolico)) return 'REPROVADO';
    return teorAlcoolico >= 92.5 && teorAlcoolico <= 95.4 ? 'APROVADO' : 'REPROVADO';
  }

  // Faixa ANP por densidade a 20°C
  private static avaliarDiesel(
    densidade: number,
    min: number,
    max: number,
  ): ResultadoAnalise {
    if (isNaN(densidade)) return 'REPROVADO';
    return densidade >= min && densidade <= max ? 'APROVADO' : 'REPROVADO';
  }
}
```

## Padrão de value object

```typescript
// src/domain/value-objects/cpf.vo.ts

export class CPF {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static criar(raw: string): CPF {
    const digits = raw.replace(/\D/g, '');
    if (!CPF.validar(digits)) throw new ValorInvalidoError('CPF inválido');
    return new CPF(digits);
  }

  private static validar(digits: string): boolean {
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;
    // validação dos dígitos verificadores
    for (let t = 9; t < 11; t++) {
      let sum = 0;
      for (let i = 0; i < t; i++) sum += parseInt(digits[i]) * (t + 1 - i);
      const check = ((sum * 10) % 11) % 10;
      if (check !== parseInt(digits[t])) return false;
    }
    return true;
  }

  get formatado(): string {
    return this.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  get raw(): string {
    return this.value;
  }
}
```

## Padrão de erros de domínio

```typescript
// src/domain/errors/domain.errors.ts

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'DomainError';
  }
}

export class CampoObrigatorioError extends DomainError {
  constructor(campo: string) {
    super('campo_obrigatorio', `Campo obrigatório ausente: ${campo}`);
  }
}

export class ValorInvalidoError extends DomainError {
  constructor(detalhe: string) {
    super('valor_invalido', detalhe);
  }
}

export class NotFoundError extends DomainError {
  constructor(entidade: string, id: string) {
    super('nao_encontrado', `${entidade} não encontrado: ${id}`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor() {
    super('acesso_negado', 'Você não tem permissão para esta ação');
    this.name = 'UnauthorizedError';
  }
}
```

## Padrão de port (repositório)

```typescript
// src/domain/ports/raq.repository.ts

import type { RAQ } from '@/domain/entities/raq.entity';

export interface FiltrosRAQ {
  postoId?: string;
  produto?: string;
  resultado?: 'APROVADO' | 'REPROVADO';
  dataInicio?: Date;
  dataFim?: Date;
}

export interface RAQRepository {
  salvar(raq: RAQ): Promise<void>;
  buscarPorId(id: string): Promise<RAQ | null>;
  listar(filtros: FiltrosRAQ): Promise<RAQ[]>;
  contarPorPosto(postoId: string): Promise<number>;
}
```

## Regras que o Codex deve seguir nesta camada

1. Nenhum `import` externo — só outros arquivos de `src/domain/`
2. Propriedades de entidade sempre `readonly`
3. Construtores sempre `private` — use factories estáticas (`criar`, `reconstituir`)
4. Toda regra de negócio fica em métodos privados da entidade
5. Erros são instâncias de `DomainError` — nunca `throw new Error('string')`
6. Sem `any`, sem `as` inseguro, sem `!` non-null assertion
7. Enums são union types literais (`'APROVADO' | 'REPROVADO'`), não `enum`