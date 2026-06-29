# SKILL: Armazenamento de Arquivos (Supabase Storage)

> Contexto para o Codex sobre como o FREE SAFE lida com upload e armazenamento de
> arquivos (fotos de colaboradores, fotos de aferição, PDFs de documentos).
> **Padrão novo a partir da 1.1.** Antes disso, arquivos eram salvos como base64
> dentro do PostgreSQL — isso está sendo substituído por Supabase Storage.

---

## 1. Por que existe esta skill

Hoje o FREE SAFE salva arquivos (fotos, PDFs) como **strings base64** em colunas
`@db.Text` do banco (`fotoUrl`, `arquivoUrl`, etc). Isso incha o banco, deixa as
queries lentas e consome o limite de armazenamento do plano. A partir da 1.1, os
**novos** arquivos vão para o **Supabase Storage**, e a coluna passa a guardar
apenas a **URL pública** do arquivo, não o conteúdo.

### Regra de ouro da migração
**NÃO migrar dados antigos.** Os registros que já têm base64 continuam como estão.
Só o fluxo de **novos uploads** muda. A leitura precisa lidar com os dois formatos
(detalhado na seção 6).

---

## 2. Decisões arquiteturais (não reabrir)

- **Onde:** Supabase Storage (o projeto já usa Supabase para o banco). Não usar
  S3/Cloudinary/outros — manter tudo no mesmo provedor.
- **O que a coluna guarda:** a partir de agora, a **URL pública** do arquivo no
  Storage (ex: `https://<projeto>.supabase.co/storage/v1/object/public/<bucket>/<path>`),
  NÃO mais o base64.
- **Buckets:** organizar por tipo de arquivo, com buckets públicos para leitura
  (os arquivos não são sensíveis a ponto de exigir URL assinada para cada visualização;
  são fotos de bombas e documentos operacionais já protegidos pelo login da aplicação):
    - `colaboradores` — fotos de colaboradores
    - `afericoes` — fotos de aferição INMETRO
    - `documentos` — PDFs e imagens de documentos
    - `postos` — logos dos postos (item da 1.1)
- **Path dentro do bucket:** sempre prefixado pelo `postoId` para organização e
  futura limpeza, com nome único para evitar colisão:
  `<postoId>/<entidadeId ou uuid>-<timestamp>.<ext>`
- **Nomenclatura:** o campo na entidade continua se chamando como hoje
  (`fotoUrl`, `arquivoUrl`) — não renomear colunas. Só muda o **conteúdo** (URL em
  vez de base64). Sem migration de schema necessária.
- **Não migrar base64 antigo.** Sem script de migração nesta fase.

---

## 3. Cliente de Storage (camada de infraestrutura)

Criar um módulo dedicado em `src/infrastructure/storage/`, seguindo o mesmo
espírito da camada de email (`src/infrastructure/email/`): um cliente isolado,
que nunca quebra o fluxo principal se o Storage falhar, e que é injetado via
container.

### Estrutura esperada
```
src/infrastructure/storage/
  supabase-storage.client.ts   # inicializa o client do Supabase com a service key
  storage.service.ts           # uploadArquivo, removerArquivo, obterUrlPublica
```

### supabase-storage.client.ts
- Usa `@supabase/supabase-js` (provavelmente já instalado; se não, `npm install @supabase/supabase-js`)
- Lê `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` das env vars (JÁ EXISTEM no projeto,
  tanto local quanto na Vercel — confirmar)
- Exporta uma instância única do client (singleton), ou `null` se faltar env var
  (mesmo padrão do `resend-client.ts` que retorna null sem a key)
- A **service key** é necessária para upload no servidor (não usar a anon key)

### storage.service.ts
Funções que NUNCA lançam exceção para o caller — retornam resultado ou null/false,
e logam o erro internamente (mesmo padrão de `email-service.ts`):

```ts
// Faz upload de um arquivo (recebido como Buffer ou base64 decodificado) e
// retorna a URL pública, ou null se falhar.
async function uploadArquivo(params: {
  bucket: string;
  path: string;        // ex: `${postoId}/${id}-${Date.now()}.jpg`
  conteudo: Buffer;    // bytes do arquivo
  contentType: string; // ex: 'image/jpeg', 'application/pdf'
}): Promise<string | null>

// Remove um arquivo do Storage (best-effort, não trava se falhar).
async function removerArquivo(bucket: string, path: string): Promise<boolean>

// Monta a URL pública a partir de bucket + path (sem chamar a API).
function obterUrlPublica(bucket: string, path: string): string
```

- No upload, usar `upsert: true` para idempotência.
- Se o client for null (sem env), `uploadArquivo` retorna null e loga um aviso —
  o caller decide o fallback (em dev sem Storage, pode cair no base64 antigo, mas
  o normal é ter as env vars).

---

## 4. Fluxo de upload nas rotas/use cases

Os uploads hoje provavelmente chegam como **base64 no corpo JSON** da requisição
(ex: a tela manda `fotoUrl: "data:image/jpeg;base64,..."`). O novo fluxo:

1. A rota recebe o base64 (manter compatibilidade com o front atual por enquanto —
   evita reescrever todas as telas de uma vez).
2. No use case (ou num helper na camada de aplicação), detectar se o valor é um
   `data:` URI base64. Se for:
    - decodificar o base64 para Buffer
    - extrair o contentType do prefixo `data:image/jpeg;base64,`
    - chamar `uploadArquivo(...)` com bucket/path apropriados
    - guardar a **URL retornada** no campo da entidade (não o base64)
3. Se o valor já for uma URL (`http...`), passar adiante sem reprocessar.
4. Se o upload falhar (retornar null), decidir: ou rejeitar com erro claro, ou
   (fallback temporário) salvar o base64 como antes. Preferir erro claro em
   produção, mas combinar com o usuário caso a caso.

> **Importante:** não quebrar o contrato atual do front de uma vez. O front pode
> continuar mandando base64; quem converte para Storage é o backend. Trocar o
> front para upload direto (multipart) é uma melhoria futura, não obrigatória agora.

### Helper sugerido
`src/application/shared/processar-upload.ts` com algo como:
```ts
// Recebe o valor do campo (base64 data-uri OU url OU null), e devolve a URL
// final a salvar. Faz upload se for base64 novo; passa adiante se já for url.
async function processarUpload(params: {
  valor: string | null | undefined;
  bucket: string;
  path: string;
}): Promise<string | null>
```
Isso centraliza a lógica e evita repetição em cada use case (colaborador, aferição,
documento, posto).

---

## 5. Onde aplicar (campos que hoje guardam base64)

Confirmar no schema, mas os campos candidatos são:
- `Colaborador.fotoUrl` → bucket `colaboradores`, path `${postoId}/${colaboradorId}-${ts}.<ext>`
- `Afericao.fotoUrl` → bucket `afericoes`, path `${postoId}/${afericaoId ou loteId}-${ts}.<ext>`
- `Documento.arquivoUrl` → bucket `documentos`, path `${postoId}/${documentoId}-${ts}.<ext>`
- `Posto.logoUrl` (campo NOVO da 1.1, se for criado) → bucket `postos`, path `${postoId}/logo-${ts}.<ext>`

Aplicar nos use cases de **criação e atualização** dessas entidades, e nos pontos
de "trocar foto" (ex: a tela de perfil do colaborador tem `handleTrocarFoto`).

---

## 6. Leitura: lidar com os dois formatos (base64 antigo + URL nova)

Como NÃO migramos os dados antigos, um mesmo campo pode conter:
- um **base64** (`data:image/...;base64,...`) — registros antigos
- uma **URL** (`https://...supabase.co/storage/...`) — registros novos

O front que renderiza imagem (`<img src={fotoUrl}>`) funciona com os dois sem
mudança, porque tanto `data:` URI quanto URL `https` são válidos em `src`. Então
**a leitura geralmente não precisa de ajuste**. Só atenção em lugares que façam
algum processamento do valor (ex: validação de tamanho, ou geração de PDF que
embute a imagem) — aí pode ser preciso detectar o formato.

---

## 7. Configuração no Supabase (manual, fora do código)

Antes de usar, os buckets precisam existir no painel do Supabase (ou criados via
código na primeira execução):
- Criar os buckets `colaboradores`, `afericoes`, `documentos`, `postos`
- Marcar como **públicos** (leitura pública), já que a proteção real é o login da app
- O Codex pode incluir um script ou instrução para criar os buckets via API na
  inicialização, mas o mais simples é criar manualmente no painel uma vez. **Avisar
  o usuário** que precisa criar os buckets antes de testar.

---

## 8. Variáveis de ambiente

JÁ EXISTEM no projeto (não recriar):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Confirmar que estão tanto no `.env` local quanto na Vercel (production). Se o
Storage usar as mesmas, não precisa adicionar nada novo.

---

## 9. Checklist do que NÃO fazer

- ❌ Não migrar/converter os base64 antigos (decisão: só daqui pra frente)
- ❌ Não renomear as colunas (`fotoUrl`/`arquivoUrl` continuam)
- ❌ Não usar a anon key para upload no servidor (usar service key)
- ❌ Não quebrar o contrato atual do front de uma vez (backend converte base64→Storage)
- ❌ Não deixar o upload travar o fluxo principal (service nunca lança; loga e segue)
- ❌ Não criar dependência de S3/Cloudinary/outros — só Supabase Storage

---

## 10. Ordem de implementação sugerida

1. Criar `supabase-storage.client.ts` + `storage.service.ts`
2. Criar o helper `processar-upload.ts`
3. Aplicar no use case de **colaborador** (criar/atualizar/trocar foto) — testar
   primeiro só esse, ponta a ponta (upload real, ver URL no banco, imagem renderiza)
4. Depois aplicar em **aferição** e **documento**
5. `Posto.logoUrl` entra junto com o item "logo do posto" da 1.1
6. Validar: novo upload vira URL no banco; registros antigos (base64) continuam
   renderizando normalmente

> Testar o item 3 isolado ANTES de propagar para as outras entidades — se o padrão
> estiver certo no colaborador, replicar é mecânico.
> 
> ---
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
name: free-safe-use-cases
description: Use esta skill ao criar casos de uso (application layer) do FREE SAFE. Cobre injeção de dependência, orquestração do domínio, autorização e tratamento de erros. Nunca chame Prisma diretamente aqui — use os ports.
---

# FREE SAFE — Camada de Casos de Uso (Application)

## Responsabilidade desta camada

Os casos de uso orquestram o domínio. Eles:
- Recebem um input tipado
- Verificam autorização
- Chamam entidades e repositórios
- Devolvem um output tipado

Eles **não** contêm regras de negócio (isso fica na entidade) e **não** chamam Prisma diretamente (isso fica na infra).

## Estrutura de pastas

```
src/application/
├── use-cases/
│   ├── raq/
│   │   ├── create-raq.use-case.ts
│   │   ├── create-raq.use-case.spec.ts
│   │   ├── emit-raq-pdf.use-case.ts
│   │   └── list-raq-by-posto.use-case.ts
│   ├── colaboradores/
│   │   ├── create-colaborador.use-case.ts
│   │   ├── update-colaborador.use-case.ts
│   │   └── list-colaboradores-by-posto.use-case.ts
│   ├── afericao/
│   │   ├── create-afericao.use-case.ts
│   │   └── list-afericoes-by-bomba.use-case.ts
│   ├── treinamentos/
│   │   ├── concluir-treinamento.use-case.ts
│   │   └── get-trilha-by-cargo.use-case.ts
│   ├── documentos/
│   │   ├── upload-documento.use-case.ts
│   │   └── list-documentos-vencendo.use-case.ts
│   └── dashboard/
│       └── get-dashboard-kpis.use-case.ts
├── authorization/
│   └── permission.guard.ts
└── dtos/
    ├── raq.dto.ts
    ├── colaborador.dto.ts
    └── afericao.dto.ts
```

## Padrão de caso de uso

```typescript
// src/application/use-cases/raq/create-raq.use-case.ts

import { RAQ } from '@/domain/entities/raq.entity';
import type { RAQRepository } from '@/domain/ports/raq.repository';
import type { StoragePort } from '@/domain/ports/storage.port';
import type { EmailPort } from '@/domain/ports/email.port';
import { PermissionGuard } from '@/application/authorization/permission.guard';
import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';

export interface CreateRAQInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  produto: string;
  temperaturaObservada: number;
  densidadeObservada: number;
  aspecto: string;
  cor: string;
  faseAquosa?: number;
  teorAlcoolico?: number;
  distribuidora?: string;
  notaFiscal?: string;
  placaCaminhao?: string;
  tanqueDestino?: string;
  boletimArquivo?: { buffer: Buffer; tipo: string };
  fotoProvetaArquivo?: { buffer: Buffer; tipo: string };
}

export interface CreateRAQOutput {
  raqId: string;
  aprovado: boolean;
  resultado: 'APROVADO' | 'REPROVADO';
}

export class CreateRAQUseCase {
  constructor(
    private readonly raqRepo: RAQRepository,
    private readonly storagePort: StoragePort,
    private readonly emailPort: EmailPort,
  ) {}

  async execute(input: CreateRAQInput): Promise<CreateRAQOutput> {
    // 1. Autorização
    PermissionGuard.verificar(input.usuario, 'escrever', 'raq');

    // Gerente só registra RAQ do próprio posto
    if (
      input.usuario.perfil === 'GERENTE' &&
      input.usuario.postoId !== input.postoId
    ) {
      PermissionGuard.negar();
    }

    // 2. Criar entidade (regras de negócio ficam na entidade)
    const raq = RAQ.criar({
      postoId: input.postoId,
      responsavelId: input.usuario.id,
      produto: input.produto as any,
      temperaturaObservada: input.temperaturaObservada,
      densidadeObservada: input.densidadeObservada,
      aspecto: input.aspecto as any,
      cor: input.cor as any,
      faseAquosa: input.faseAquosa,
      teorAlcoolico: input.teorAlcoolico,
      distribuidora: input.distribuidora,
      notaFiscal: input.notaFiscal,
      placaCaminhao: input.placaCaminhao,
      tanqueDestino: input.tanqueDestino,
    });

    // 3. Persistir
    await this.raqRepo.salvar(raq);

    // 4. Uploads opcionais (não bloqueia o resultado)
    if (input.boletimArquivo) {
      await this.storagePort.upload(
        `raq/${raq.id}/boletim`,
        input.boletimArquivo.buffer,
        input.boletimArquivo.tipo,
      );
    }

    if (input.fotoProvetaArquivo) {
      await this.storagePort.upload(
        `raq/${raq.id}/foto-proveta`,
        input.fotoProvetaArquivo.buffer,
        input.fotoProvetaArquivo.tipo,
      );
    }

    // 5. Notificação (falha silenciosa — não propaga erro de e-mail)
    if (!raq.estaAprovado) {
      await this.emailPort
        .enviarAlerta({
          para: input.usuario.email,
          assunto: `RAQ reprovada — ${input.produto}`,
          corpo: `A análise do produto ${input.produto} foi reprovada no posto ${input.postoId}.`,
        })
        .catch(() => {}); // falha silenciosa intencional
    }

    return {
      raqId: raq.id,
      aprovado: raq.estaAprovado,
      resultado: raq.resultado,
    };
  }
}
```

## Padrão de autorização

```typescript
// src/application/authorization/permission.guard.ts

import { UnauthorizedError } from '@/domain/errors/domain.errors';
import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';

type Acao = 'ler' | 'escrever';
type Recurso =
  | 'raq' | 'afericao' | 'colaboradores' | 'treinamentos'
  | 'entrevistas' | 'documentos' | 'manutencao' | 'drenagem'
  | 'auditorias' | 'relatorios' | 'postos' | 'usuarios';

type MatrizPermissoes = Record<string, Record<Acao, Recurso[] | ['*']>>;

const PERMISSOES: MatrizPermissoes = {
  ADMIN: {
    ler:      ['*'],
    escrever: ['*'],
  },
  GERENTE: {
    ler:      ['colaboradores', 'raq', 'afericao', 'documentos', 'manutencao', 'drenagem', 'treinamentos'],
    escrever: ['raq', 'afericao', 'manutencao', 'drenagem', 'entrevistas'],
  },
  RH: {
    ler:      ['colaboradores', 'entrevistas', 'treinamentos', 'relatorios'],
    escrever: ['entrevistas', 'colaboradores'],
  },
  COLABORADOR: {
    ler:      ['treinamentos'],
    escrever: [],
  },
  MANUTENCAO: {
    ler:      ['manutencao', 'drenagem'],
    escrever: ['manutencao', 'drenagem'],
  },
};

export class PermissionGuard {
  static verificar(usuario: UsuarioAutenticado, acao: Acao, recurso: Recurso): void {
    const permissoes = PERMISSOES[usuario.perfil];
    if (!permissoes) throw new UnauthorizedError();

    const lista = permissoes[acao];
    if (!lista) throw new UnauthorizedError();

    const permitido = lista.includes('*') || lista.includes(recurso);
    if (!permitido) throw new UnauthorizedError();
  }

  static negar(): never {
    throw new UnauthorizedError();
  }
}
```

## DTOs compartilhados

```typescript
// src/application/dtos/auth.dto.ts

export type PerfilUsuario = 'ADMIN' | 'GERENTE' | 'RH' | 'COLABORADOR' | 'MANUTENCAO';

export interface UsuarioAutenticado {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  postoId: string | null; // null = admin geral (acesso a todos)
}
```

## Padrão de caso de uso com query (leitura)

```typescript
// src/application/use-cases/dashboard/get-dashboard-kpis.use-case.ts

export interface GetDashboardKPIsOutput {
  totalPostos: number;
  totalColaboradores: number;
  mediaConformidade: number;
  totalPendencias: number;
  alertas: AlertaItem[];
}

export class GetDashboardKPIsUseCase {
  constructor(
    private readonly postoRepo: PostoRepository,
    private readonly colaboradorRepo: ColaboradorRepository,
    private readonly raqRepo: RAQRepository,
    private readonly documentoRepo: DocumentoRepository,
  ) {}

  async execute(usuario: UsuarioAutenticado): Promise<GetDashboardKPIsOutput> {
    PermissionGuard.verificar(usuario, 'ler', 'relatorios');

    // Queries paralelas — nunca sequenciais
    const [postos, totalColaboradores, raqsSemBoletim, documentosVencendo] =
      await Promise.all([
        this.postoRepo.listar(),
        this.colaboradorRepo.contarAtivos(),
        this.raqRepo.contarSemBoletim(),
        this.documentoRepo.listarVencendoEm(30),
      ]);

    const mediaConformidade =
      postos.reduce((sum, p) => sum + p.conformidade, 0) / postos.length;

    const alertas: AlertaItem[] = [
      ...(raqsSemBoletim > 0
        ? [{ tipo: 'RAQ sem boletim', quantidade: raqsSemBoletim, nivel: 'critico' as const }]
        : []),
      ...(documentosVencendo.length > 0
        ? [{ tipo: 'Documentos vencendo', quantidade: documentosVencendo.length, nivel: 'atencao' as const }]
        : []),
    ];

    return {
      totalPostos: postos.length,
      totalColaboradores,
      mediaConformidade: Math.round(mediaConformidade),
      totalPendencias: alertas.reduce((sum, a) => sum + a.quantidade, 0),
      alertas,
    };
  }
}
```

## Regras que o Codex deve seguir nesta camada

1. Sempre verificar autorização **antes** de qualquer operação
2. Queries paralelas com `Promise.all` — nunca `await` sequencial para múltiplas queries independentes
3. Uploads e e-mails com falha silenciosa (`.catch(() => {})`) — nunca deixar falha de I/O cancelar a operação principal
4. Sem lógica de negócio aqui — mova para a entidade se precisar calcular algo
5. Um arquivo por caso de uso — nunca agrupe múltiplos em um arquivo
6. Todo caso de uso tem `Input` e `Output` tipados e exportados
7. Sem chamada direta ao Prisma — use `this.xyzRepo`

---
name: free-safe-api-routes
description: Use esta skill ao criar rotas de API (app/api/*) do FREE SAFE. Cobre o padrão de rota fina, validação Zod, autenticação, tratamento de erros e upload de arquivos. A rota nunca contém regra de negócio — só coordena.
---

# FREE SAFE — API Routes (Next.js 14 App Router)

## Princípio fundamental

A API Route é a borda do sistema. Ela faz exatamente quatro coisas e nada mais:
1. Verifica a sessão
2. Valida o body com Zod
3. Chama o caso de uso
4. Devolve o resultado

Se você está escrevendo lógica de negócio dentro de uma rota, mova para o caso de uso.

## Estrutura de pastas

```
app/api/
├── auth/
│   └── [...nextauth]/route.ts
├── postos/
│   ├── route.ts                    (GET lista, POST cria)
│   └── [id]/
│       └── route.ts                (GET detalhe, PATCH atualiza)
├── colaboradores/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── ficha/route.ts
├── raq/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── pdf/route.ts            (GET retorna PDF binário)
├── afericao/
│   ├── route.ts
│   └── [id]/route.ts
├── treinamentos/
│   ├── route.ts
│   └── [colaboradorId]/route.ts
├── documentos/
│   ├── route.ts
│   └── [id]/route.ts
└── dashboard/
    └── kpis/route.ts
```

## Padrão de rota POST

```typescript
// app/api/raq/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { container } from '@/lib/container';
import { handleApiError } from '@/lib/api-error-handler';

const CreateRAQSchema = z.object({
  postoId:              z.string().uuid(),
  produto:              z.enum(['GASOLINA_COMUM', 'GASOLINA_ADITIVADA', 'GASOLINA_PREMIUM', 'ETANOL_HIDRATADO', 'DIESEL_S10', 'DIESEL_S500']),
  temperaturaObservada: z.number().min(-50).max(100),
  densidadeObservada:   z.number().min(0.5).max(1.5),
  aspecto:              z.enum(['LIQUIDO_E_ISENTO', 'TURVO', 'COM_IMPUREZAS']),
  cor:                  z.enum(['CARACTERISTICA', 'ALTERADA']),
  faseAquosa:           z.number().optional(),
  teorAlcoolico:        z.number().optional(),
  distribuidora:        z.string().max(100).optional(),
  notaFiscal:           z.string().max(50).optional(),
  placaCaminhao:        z.string().max(10).optional(),
  tanqueDestino:        z.string().max(50).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'nao_autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const postoId = searchParams.get('postoId') ?? undefined;
    const dataInicio = searchParams.get('dataInicio')
      ? new Date(searchParams.get('dataInicio')!)
      : undefined;
    const dataFim = searchParams.get('dataFim')
      ? new Date(searchParams.get('dataFim')!)
      : undefined;

    const useCase = container.listRAQByPostoUseCase;
    const result = await useCase.execute({
      usuario: session.user,
      filtros: { postoId, dataInicio, dataFim },
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'nao_autenticado' }, { status: 401 });

    const body = await req.json();
    const parsed = CreateRAQSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados_invalidos', detalhes: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const useCase = container.createRAQUseCase;
    const result = await useCase.execute({
      usuario: session.user,
      ...parsed.data,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Padrão de rota com upload de arquivo

```typescript
// app/api/raq/[id]/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { container } from '@/lib/container';
import { handleApiError } from '@/lib/api-error-handler';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'nao_autenticado' }, { status: 401 });

    const formData = await req.formData();
    const boletim = formData.get('boletim') as File | null;
    const fotoProveta = formData.get('fotoProveta') as File | null;

    const boletimArquivo = boletim
      ? { buffer: Buffer.from(await boletim.arrayBuffer()), tipo: boletim.type }
      : undefined;

    const fotoProvetaArquivo = fotoProveta
      ? { buffer: Buffer.from(await fotoProveta.arrayBuffer()), tipo: fotoProveta.type }
      : undefined;

    const useCase = container.uploadAnexoRAQUseCase;
    const result = await useCase.execute({
      usuario: session.user,
      raqId: params.id,
      boletimArquivo,
      fotoProvetaArquivo,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Padrão de rota que retorna PDF binário

```typescript
// app/api/raq/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { container } from '@/lib/container';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'nao_autenticado' }, { status: 401 });

    const useCase = container.emitRAQPdfUseCase;
    const pdfBuffer = await useCase.execute({ usuario: session.user, raqId: params.id });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="raq-${params.id}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Tratamento centralizado de erros

```typescript
// src/lib/api-error-handler.ts
import { NextResponse } from 'next/server';
import {
  DomainError,
  NotFoundError,
  UnauthorizedError,
  ValorInvalidoError,
} from '@/domain/errors/domain.errors';

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.code, mensagem: error.message }, { status: 403 });
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.code, mensagem: error.message }, { status: 404 });
  }

  if (error instanceof ValorInvalidoError) {
    return NextResponse.json({ error: error.code, mensagem: error.message }, { status: 422 });
  }

  if (error instanceof DomainError) {
    return NextResponse.json({ error: error.code, mensagem: error.message }, { status: 400 });
  }

  // Erro inesperado — log estruturado, nunca vazar detalhes ao client
  console.error('[ERRO_NAO_TRATADO]', error);
  return NextResponse.json({ error: 'erro_interno' }, { status: 500 });
}
```

## Validação de variáveis de ambiente

```typescript
// src/lib/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL:           z.string().url(),
  NEXTAUTH_URL:           z.string().url(),
  NEXTAUTH_SECRET:        z.string().min(32),
  SUPABASE_URL:           z.string().url(),
  SUPABASE_SERVICE_KEY:   z.string().min(10),
  RESEND_API_KEY:         z.string().min(10),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', parsed.error.flatten());
  throw new Error('Variáveis de ambiente ausentes ou inválidas. Veja o .env.example');
}

export const env = parsed.data;
```

## Container de dependências

```typescript
// src/lib/container.ts
import { PrismaClient } from '@prisma/client';
import { RAQPrismaRepository } from '@/infrastructure/database/prisma/repositories/raq.prisma-repository';
import { ColaboradorPrismaRepository } from '@/infrastructure/database/prisma/repositories/colaborador.prisma-repository';
import { PostoPrismaRepository } from '@/infrastructure/database/prisma/repositories/posto.prisma-repository';
import { DocumentoPrismaRepository } from '@/infrastructure/database/prisma/repositories/documento.prisma-repository';
import { SupabaseStorageAdapter } from '@/infrastructure/storage/supabase-storage.adapter';
import { ResendEmailAdapter } from '@/infrastructure/email/resend-email.adapter';
import { ReactPDFAdapter } from '@/infrastructure/pdf/react-pdf.adapter';
import { CreateRAQUseCase } from '@/application/use-cases/raq/create-raq.use-case';
import { EmitRAQPdfUseCase } from '@/application/use-cases/raq/emit-raq-pdf.use-case';
import { ListRAQByPostoUseCase } from '@/application/use-cases/raq/list-raq-by-posto.use-case';
import { GetDashboardKPIsUseCase } from '@/application/use-cases/dashboard/get-dashboard-kpis.use-case';

// Singleton do Prisma (padrão Next.js para evitar múltiplas conexões em dev)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Repositórios
const raqRepo           = new RAQPrismaRepository(prisma);
const colaboradorRepo   = new ColaboradorPrismaRepository(prisma);
const postoRepo         = new PostoPrismaRepository(prisma);
const documentoRepo     = new DocumentoPrismaRepository(prisma);

// Adapters de serviços externos
const storageAdapter = new SupabaseStorageAdapter();
const emailAdapter   = new ResendEmailAdapter();
const pdfAdapter     = new ReactPDFAdapter();

// Casos de uso (instâncias frescas por request — sem estado compartilhado)
export const container = {
  get createRAQUseCase()        { return new CreateRAQUseCase(raqRepo, storageAdapter, emailAdapter); },
  get emitRAQPdfUseCase()       { return new EmitRAQPdfUseCase(raqRepo, postoRepo, pdfAdapter); },
  get listRAQByPostoUseCase()   { return new ListRAQByPostoUseCase(raqRepo); },
  get getDashboardKPIsUseCase() { return new GetDashboardKPIsUseCase(postoRepo, colaboradorRepo, raqRepo, documentoRepo); },
};
```

## Convenções de rotas

| Método | Rota                          | Ação                          |
|--------|-------------------------------|-------------------------------|
| GET    | /api/raq                      | Listar RAQs (com filtros)     |
| POST   | /api/raq                      | Criar nova RAQ                |
| GET    | /api/raq/[id]                 | Buscar RAQ por ID             |
| GET    | /api/raq/[id]/pdf             | Emitir PDF da RAQ             |
| POST   | /api/raq/[id]/upload          | Anexar boletim/foto           |
| GET    | /api/colaboradores            | Listar colaboradores          |
| POST   | /api/colaboradores            | Cadastrar colaborador         |
| PATCH  | /api/colaboradores/[id]       | Atualizar colaborador         |
| GET    | /api/colaboradores/[id]/ficha | Ficha completa do colaborador |
| GET    | /api/dashboard/kpis           | KPIs consolidados             |

## Regras que o Codex deve seguir nas rotas

1. Sempre `try/catch` com `handleApiError` no catch — nunca deixar erro vazar sem tratamento
2. Sempre verificar `session?.user` antes de qualquer operação
3. Validação Zod com `safeParse` — nunca `parse` (que lança exceção sem controle)
4. Parâmetros de query via `new URL(req.url).searchParams` — nunca `req.nextUrl.searchParams` (falha em alguns contextos)
5. Nunca importar Prisma ou repositório diretamente na rota — use `container`
6. Rotas de upload usam `req.formData()` — nunca `req.json()` com arquivo
7. PDF retorna `new NextResponse(buffer, { headers: { 'Content-Type': 'application/pdf' } })`
8. Status codes: 201 para criação, 200 para leitura, 422 para validação, 403 para acesso negado, 404 para não encontrado, 500 para erro interno


---
name: free-safe-frontend
description: Use esta skill ao criar páginas, componentes e hooks do frontend FREE SAFE. Cobre o padrão de conexão com APIs reais via React Query, substituição de dados mockados, componentes com Tailwind + shadcn/ui e navegação com Next.js App Router.
---

# FREE SAFE — Frontend (Next.js + React Query)

## Princípio fundamental

O frontend do FREE SAFE é o protótipo React já existente, migrado para consumir APIs reais.
Cada array fixo (`postos`, `colaboradores`, `cursos`) vira uma chamada `useQuery`.
Cada `useState` de formulário que hoje não salva nada vira um `useMutation` que chama a API.

## Estrutura de pastas do frontend

```
src/app/
├── (auth)/
│   └── login/page.tsx              ← já existe
├── (dashboard)/
│   ├── layout.tsx                  ← sidebar + header
│   ├── page.tsx                    ← dashboard geral
│   ├── postos/
│   │   ├── page.tsx                ← lista de postos
│   │   └── [id]/page.tsx           ← detalhe do posto
│   ├── colaboradores/
│   │   ├── page.tsx                ← lista
│   │   └── [id]/page.tsx           ← ficha do colaborador
│   ├── treinamentos/page.tsx
│   ├── entrevistas/page.tsx
│   ├── anp/page.tsx                ← formulário RAQ
│   ├── inmetro/page.tsx            ← formulário aferição
│   ├── manutencao/page.tsx
│   ├── drenagem/page.tsx
│   ├── documentos/page.tsx
│   ├── auditorias/page.tsx
│   └── relatorios/page.tsx
│
src/components/
├── ui/                             ← shadcn/ui (já existe)
├── layout/
│   ├── sidebar.tsx
│   └── header.tsx
├── dashboard/
│   ├── stat-card.tsx
│   ├── ranking-postos.tsx
│   └── alertas-criticos.tsx
├── postos/
│   └── posto-card.tsx
├── colaboradores/
│   ├── colaborador-table.tsx
│   └── colaborador-form.tsx
├── raq/
│   ├── raq-form.tsx
│   └── raq-resultado.tsx
└── afericao/
    ├── afericao-form.tsx
    └── afericao-resultado.tsx
│
src/hooks/
├── use-postos.ts
├── use-colaboradores.ts
├── use-raq.ts
├── use-afericao.ts
└── use-dashboard.ts
│
src/lib/
├── api-client.ts                   ← fetch wrapper com auth
└── query-client.ts                 ← React Query config
```

## Configuração do React Query

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,      // 2 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

```typescript
// src/app/(dashboard)/layout.tsx
'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-zinc-100">
        <Sidebar />
        <div className="lg:pl-72">
          <Header />
          <main className="p-5 lg:p-8">{children}</main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
```

## API Client — wrapper de fetch com autenticação

```typescript
// src/lib/api-client.ts

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'erro_desconhecido' }));
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }

  const json = await response.json();
  return json.data ?? json;
}

export const apiClient = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};
```

## Padrão de hook de query

```typescript
// src/hooks/use-postos.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Posto {
  id: string;
  nome: string;
  cidade: string;
  uf: string;
  conformidade: number;
}

export function usePostos() {
  return useQuery({
    queryKey: ['postos'],
    queryFn: () => apiClient.get<Posto[]>('/api/postos'),
  });
}
```

```typescript
// src/hooks/use-dashboard.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface DashboardKPIs {
  totalPostos: number;
  totalColaboradores: number;
  mediaConformidade: number;
  totalPendencias: number;
  alertas: Array<{ tipo: string; quantidade: number; nivel: 'critico' | 'atencao' }>;
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => apiClient.get<DashboardKPIs>('/api/dashboard/kpis'),
  });
}
```

## Padrão de hook de mutation

```typescript
// src/hooks/use-raq.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface CreateRAQInput {
  postoId: string;
  produto: string;
  temperaturaObservada: number;
  densidadeObservada: number;
  aspecto: string;
  cor: string;
  faseAquosa?: number;
  teorAlcoolico?: number;
  distribuidora?: string;
  notaFiscal?: string;
  placaCaminhao?: string;
  tanqueDestino?: string;
}

export interface CreateRAQOutput {
  raqId: string;
  aprovado: boolean;
  resultado: 'APROVADO' | 'REPROVADO';
}

export function useCreateRAQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRAQInput) =>
      apiClient.post<CreateRAQOutput>('/api/raq', input),
    onSuccess: () => {
      // Invalida a lista de RAQs após criar uma nova
      queryClient.invalidateQueries({ queryKey: ['raq'] });
    },
  });
}

export function useRAQsByPosto(postoId: string) {
  return useQuery({
    queryKey: ['raq', postoId],
    queryFn: () => apiClient.get(`/api/raq?postoId=${postoId}`),
    enabled: !!postoId,
  });
}
```

## Padrão de página conectada à API

```typescript
// src/app/(dashboard)/page.tsx — Dashboard real
'use client';
import { useDashboardKPIs } from '@/hooks/use-dashboard';
import { usePostos } from '@/hooks/use-postos';
import { StatCard } from '@/components/dashboard/stat-card';
import { RankingPostos } from '@/components/dashboard/ranking-postos';
import { AlertasCriticos } from '@/components/dashboard/alertas-criticos';
import { Building2, Users, BadgeCheck, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { data: kpis, isLoading: loadingKPIs } = useDashboardKPIs();
  const { data: postos, isLoading: loadingPostos } = usePostos();

  if (loadingKPIs || loadingPostos) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-600">
          FREE SAFE
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Dashboard Geral</h1>
        <p className="mt-1 text-zinc-500">Visão consolidada dos postos, treinamentos e conformidade.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Postos cadastrados" value={kpis?.totalPostos ?? 0} subtitle="Unidades ativas" icon={Building2} />
        <StatCard title="Colaboradores" value={kpis?.totalColaboradores ?? 0} subtitle="Ativos no sistema" icon={Users} tone="green" />
        <StatCard title="Conformidade média" value={`${kpis?.mediaConformidade ?? 0}%`} subtitle="Auditoria operacional" icon={BadgeCheck} tone="yellow" />
        <StatCard title="Pendências abertas" value={kpis?.totalPendencias ?? 0} subtitle="Itens para regularizar" icon={AlertTriangle} tone="red" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <RankingPostos postos={postos ?? []} />
        <AlertasCriticos alertas={kpis?.alertas ?? []} />
      </div>
    </div>
  );
}
```

## Padrão de formulário com mutation

```typescript
// Exemplo de formulário RAQ conectado à API real
'use client';
import { useState } from 'react';
import { useCreateRAQ } from '@/hooks/use-raq';

export function RAQForm({ postos }: { postos: Posto[] }) {
  const [produto, setProduto] = useState('GASOLINA_COMUM');
  const [postoId, setPostoId] = useState('');
  const [faseAquosa, setFaseAquosa] = useState('');
  // ... outros campos

  const { mutate: criarRAQ, isPending, data: resultado } = useCreateRAQ();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    criarRAQ({
      postoId,
      produto,
      temperaturaObservada: 28.5,
      densidadeObservada: 0.743,
      aspecto: 'LIQUIDO_E_ISENTO',
      cor: 'CARACTERISTICA',
      faseAquosa: parseFloat(faseAquosa),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* campos do formulário */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Salvando...' : 'Registrar análise'}
      </button>

      {resultado && (
        <div className={resultado.aprovado ? 'text-green-600' : 'text-red-600'}>
          {resultado.resultado}
        </div>
      )}
    </form>
  );
}
```

## Sidebar — migrar do protótipo

```typescript
// src/components/layout/sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, GraduationCap,
  ClipboardCheck, FlaskConical, Gauge, Wrench,
  Droplets, FolderCheck, ClipboardList, BarChart3,
} from 'lucide-react';

const nav = [
  { href: '/',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/postos',        label: 'Postos',       icon: Building2 },
  { href: '/colaboradores', label: 'Colaboradores',icon: Users },
  { href: '/treinamentos',  label: 'Treinamentos', icon: GraduationCap },
  { href: '/entrevistas',   label: 'Entrevistas',  icon: ClipboardCheck },
  { href: '/anp',           label: 'ANP / RAQ',    icon: FlaskConical },
  { href: '/inmetro',       label: 'INMETRO',      icon: Gauge },
  { href: '/manutencao',    label: 'Manutenção',   icon: Wrench },
  { href: '/drenagem',      label: 'Drenagem',     icon: Droplets },
  { href: '/documentos',    label: 'Documentos',   icon: FolderCheck },
  { href: '/auditorias',    label: 'Auditorias',   icon: ClipboardList },
  { href: '/relatorios',    label: 'Relatórios',   icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-20 hidden h-screen w-72 flex-col bg-zinc-950 text-white lg:flex">
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-xl font-black">F</div>
          <div>
            <p className="text-xl font-black tracking-tight">FREE SAFE</p>
            <p className="text-xs text-zinc-400">Treinamento · Qualidade · Conformidade</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {nav.map((item) => {
          const Icon = item.icon;
          const selected = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                selected
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-950/30'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" /> {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

## Regras que o Codex deve seguir no frontend

1. Nunca usar dados hardcoded — sempre `useQuery` ou `useMutation`
2. Todo `useQuery` tem estado de loading com spinner laranja
3. Todo `useMutation` tem estado `isPending` no botão ("Salvando...")
4. Erros de API exibidos com toast via Sonner
5. Formulários usam `react-hook-form` + validação Zod no cliente
6. Nunca usar `useState` para dados que vêm da API — use `useQuery`
7. Componentes de página são `'use client'` apenas se tiverem interatividade
8. Prefira Server Components para páginas simples de listagem
9. Links usam `<Link href="">` do Next.js — nunca `<a href="">`
10. Cores: laranja `#f97316` (orange-500), fundo zinc-100, cards brancos com borda zinc-200

---
name: free-safe-design-system
description: Use esta skill ao refinar a interface, aplicar polimento visual, ajustar componentes de UI, ícones, tipografia, animações e microinterações no FREE SAFE. Define os tokens de design, escala de ícones, padrões de animação e os componentes base reutilizáveis do tom "clean corporativo laranja".
---

# FREE SAFE — Design System (Clean Corporativo Laranja)

## Identidade visual

Tom: clean, corporativo, confiável. O laranja é a cor de marca (energia,
combustível, ação) usada com parcimônia sobre uma base neutra (zinc/branco).
Não é um app colorido — é uma ferramenta profissional onde o laranja guia o olho
para o que importa: ações primárias, itens ativos, destaques.

## Paleta de cores

Cor de marca (laranja):
- orange-500 (#f97316) — ações primárias, item ativo, ícones de destaque
- orange-600 (#ea580c) — hover de botões primários
- orange-50 (#fff7ed) — fundos sutis de seleção/destaque
- orange-100 (#ffedd5) — badges, chips

Base neutra:
- zinc-950 (#09090b) — sidebar, texto forte, botões escuros
- zinc-900 — títulos
- zinc-700 — texto de corpo
- zinc-500 — texto secundário, labels
- zinc-200 — bordas
- zinc-100 — fundos sutis, divisores
- zinc-50 — fundo de página, cabeçalhos de tabela
- white — cards

Status (semânticas):
- emerald-500/600 + emerald-50/100 — sucesso, DENTRO, aprovado, válido
- amber-500/600 + amber-50/100 — atenção, vencendo, em andamento
- red-500/600 + red-50/100 — erro, FORA, reprovado, vencido

## Escala tipográfica

A fonte é Geist (já configurada). Use esta escala consistente:
- Título de página (h1): text-2xl font-bold tracking-tight text-zinc-950 (NÃO text-3xl)
- Subtítulo de página: text-sm text-zinc-500
- Título de card/seção (h2): text-base font-semibold text-zinc-900
- Label de campo: text-sm font-medium text-zinc-700
- Corpo: text-sm text-zinc-700
- Texto secundário: text-xs text-zinc-500
- Número/destaque (KPI): text-3xl font-bold tabular-nums

Regra: títulos com tracking-tight, números com tabular-nums para alinhamento.

## Ícones — ESCALA CORRIGIDA

O problema atual é que tudo usa h-4 w-4 (16px), pequeno demais.
Nova escala:
- Ícones de navegação (sidebar): h-5 w-5 (20px)
- Ícones em botões: h-4 w-4 (16px) é ok dentro de botões pequenos, h-5 w-5 em botões maiores
- Ícones de cabeçalho de seção/card: h-5 w-5 (20px)
- Ícones de destaque/feature (empty state, KPI): h-6 w-6 ou h-7 w-7
- Ícones de ação isolados (header): h-5 w-5 (20px), nunca 16px

Sempre usar strokeWidth padrão do lucide (2). Para ícones grandes de destaque,
considerar strokeWidth={1.5} para um visual mais elegante.

Ícones SEMPRE dentro de um container com cor de fundo quando são de destaque:
ex: <div className="rounded-xl bg-orange-50 p-2"><Icon className="h-5 w-5 text-orange-600" /></div>

## Raio de borda (consistência)

- Cards: rounded-2xl
- Inputs, selects, botões: rounded-xl
- Badges, chips: rounded-full
- Containers de ícone: rounded-xl ou rounded-lg
- Modais: rounded-2xl

## Sombras

- Cards: shadow-sm (sutil)
- Cards em hover (clicáveis): hover:shadow-md transition-shadow
- Botões primários: shadow-sm
- Dropdowns/popovers: shadow-lg
- Modais: shadow-xl

## Espaçamento

- Padding de card: p-5 (p-6 para cards maiores/destaque)
- Gap entre cards: gap-4 ou gap-6
- Gap entre seções verticais: space-y-6
- Padding de input: px-3 py-2 (py-2.5 para inputs maiores)

## Componentes base — padrões

### Botão primário
```
className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
```

### Botão secundário (outline)
```
className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98]"
```

### Botão destrutivo (texto)
```
className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
```

### Input/Select
```
className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
```
Nota: adicionar o focus:ring-2 com cor laranja translúcida é a microinteração-chave.

### Card
```
className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
```

### Card clicável (hover)
```
className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-zinc-300 cursor-pointer"
```

## Animações e microinterações (framer-motion)

### Entrada de página (padrão)
```
initial={{ opacity: 0, y: 16 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.35, ease: 'easeOut' }}
```

### Entrada de lista com stagger (cards/itens)
```
// container
transition={{ staggerChildren: 0.05 }}
// item
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
```

### Hover de card interativo
```
whileHover={{ y: -2 }}
transition={{ type: 'spring', stiffness: 300 }}
```

### Tap/click feedback
```
whileTap={{ scale: 0.98 }}
```

### Expand/collapse (accordion)
```
initial={{ height: 0, opacity: 0 }}
animate={{ height: 'auto', opacity: 1 }}
exit={{ height: 0, opacity: 0 }}
transition={{ duration: 0.25, ease: 'easeInOut' }}
// envolver com AnimatePresence e overflow-hidden
```

### Microinterações obrigatórias
- Todo botão: active:scale-[0.98] ou whileTap
- Todo input: focus:ring-2 focus:ring-orange-500/20
- Todo card clicável: hover:shadow-md transition-all
- Toda navegação ativa: transição suave de cor
- Loading: spinner laranja, nunca travar a tela sem feedback

## Estados vazios (empty states)

Sempre com ícone grande (h-10 w-10) em container circular zinc-50,
título em zinc-700 e descrição em zinc-500, opcionalmente um botão de ação.

## Sidebar — refinamento

- Ícones h-5 w-5 (não h-4 w-4)
- Item ativo: bg-orange-500 com leve glow (shadow-lg shadow-orange-500/20)
- Hover de item inativo: bg-white/10 com transição suave
- Espaçamento entre itens: space-y-1
- Agrupar itens por categoria com labels pequenos (opcional)

## Regras gerais que o Codex deve seguir

1. NUNCA usar ícones menores que h-4 w-4; padrão de navegação e seção é h-5 w-5
2. Títulos de página são text-2xl (não text-3xl), com tracking-tight
3. Todo input recebe focus:ring-2 focus:ring-orange-500/20
4. Todo botão recebe feedback de clique (active:scale ou whileTap)
5. Cards clicáveis recebem hover:shadow-md transition-all
6. Usar tabular-nums em números e KPIs
7. Manter a base neutra zinc + laranja de marca; não introduzir cores novas
8. Ícones de destaque vão em container com fundo (bg-orange-50, p-2, rounded-xl)
9. Preservar toda a lógica e funcionalidade — mexer apenas em classes visuais e animação
10. Consistência de raio: cards rounded-2xl, controles rounded-xl, badges rounded-full

> 