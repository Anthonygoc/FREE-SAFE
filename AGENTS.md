---
name: free-safe-cursos
description: Use esta skill ao criar qualquer parte do módulo de cursos NR do FREE SAFE. Cobre entidades, repositórios, casos de uso, rotas de API e frontend do sistema de cursos, provas e certificados.
---

# FREE SAFE — Módulo de Cursos NR

## Contexto do negócio

O módulo de cursos serve para treinar colaboradores dos postos da Rede Free
nas Normas Regulamentadoras obrigatórias (NR-01, NR-06, NR-09, NR-17, NR-20, etc.)
e em cursos internos (Atendimento, Caixa, ANP, INMETRO).

Fluxo completo:
1. Colaborador acessa a trilha do seu cargo
2. Assiste/lê o conteúdo (PDF + vídeo YouTube embed)
3. Responde a mini prova (múltipla escolha, mín. 70% para aprovação)
4. Se aprovado → gera certificado PDF com logo do posto

## Schema Prisma — tabelas do módulo

```prisma
model CursoConteudo {
  id          String   @id @default(uuid())
  cursoId     String   @map("curso_id")
  ordem       Int
  titulo      String   @db.VarChar(200)
  tipo        TipoConteudo
  conteudo    String   @db.Text
  criadoEm   DateTime  @default(now()) @map("criado_em")

  curso Curso @relation(fields: [cursoId], references: [id])

  @@map("curso_conteudos")
}

model CursoQuestao {
  id         String   @id @default(uuid())
  cursoId    String   @map("curso_id")
  ordem      Int
  enunciado  String   @db.Text
  alternativas Json
  gabarito   String   @db.VarChar(1)
  criadoEm  DateTime  @default(now()) @map("criado_em")

  curso       Curso          @relation(fields: [cursoId], references: [id])
  respostas   ProvaResposta[]

  @@map("curso_questoes")
}

model ProvaAttempt {
  id              String   @id @default(uuid())
  colaboradorId   String   @map("colaborador_id")
  cursoId         String   @map("curso_id")
  nota            Float
  aprovado        Boolean
  certificadoUrl  String?  @map("certificado_url") @db.VarChar(500)
  criadoEm       DateTime  @default(now()) @map("criado_em")

  colaborador Colaborador    @relation(fields: [colaboradorId], references: [id])
  curso       Curso          @relation(fields: [cursoId], references: [id])
  respostas   ProvaResposta[]

  @@map("prova_attempts")
}

model ProvaResposta {
  id          String   @id @default(uuid())
  attemptId   String   @map("attempt_id")
  questaoId   String   @map("questao_id")
  resposta    String   @db.VarChar(1)
  correta     Boolean

  attempt ProvaAttempt @relation(fields: [attemptId], references: [id])
  questao CursoQuestao @relation(fields: [questaoId], references: [id])

  @@map("prova_respostas")
}

enum TipoConteudo {
  PDF_TEXTO
  VIDEO_YOUTUBE
  TEXTO_RICO
}
```

## Ports do domínio

```typescript
// src/domain/ports/curso-conteudo.repository.ts
export interface CursoConteudoRepository {
  listarPorCurso(cursoId: string): Promise<CursoConteudo[]>;
  buscarPorId(id: string): Promise<CursoConteudo | null>;
}

// src/domain/ports/curso-questao.repository.ts
export interface CursoQuestaoRepository {
  listarPorCurso(cursoId: string): Promise<CursoQuestao[]>;
}

// src/domain/ports/prova-attempt.repository.ts
export interface ProvaAttemptRepository {
  salvar(attempt: ProvaAttempt): Promise<void>;
  buscarUltimoPorColaboradorECurso(colaboradorId: string, cursoId: string): Promise<ProvaAttempt | null>;
  listarPorColaborador(colaboradorId: string): Promise<ProvaAttempt[]>;
}
```

## Casos de uso

### GetCursoConteudoUseCase
- Input: usuario, cursoId
- Verifica que o colaborador tem esse curso na trilha
- Retorna: lista de seções com tipo (PDF_TEXTO, VIDEO_YOUTUBE, TEXTO_RICO)
- Não bloqueia acesso — qualquer perfil pode ver

### SubmitProvaUseCase
- Input: usuario, cursoId, respostas: Array<{ questaoId, resposta }>
- Busca gabarito no banco (nunca expõe gabarito ao front)
- Calcula nota: (acertos / total) * 100
- Aprovado se nota >= 70
- Salva ProvaAttempt com respostas
- Se aprovado: marca TreinamentoColaborador como CONCLUIDO
- Se aprovado: aciona geração de certificado
- Retorna: nota, aprovado, acertos, total, detalhe por questão

### EmitCertificadoUseCase
- Input: usuario, attemptId
- Busca attempt + colaborador + curso + posto
- Gera PDF do certificado
- Salva URL no attempt
- Retorna: buffer do PDF

## Rotas de API

```
GET  /api/cursos                          → lista todos os cursos ativos
GET  /api/cursos/[id]                     → detalhe do curso
GET  /api/cursos/[id]/conteudo            → seções do curso (para exibir)
GET  /api/cursos/[id]/questoes            → questões SEM gabarito
POST /api/cursos/[id]/prova               → submeter respostas da prova
GET  /api/cursos/[id]/prova/resultado     → último resultado do colaborador
GET  /api/certificados/[attemptId]        → download do certificado PDF
GET  /api/colaboradores/[id]/trilha       → cursos obrigatórios por cargo
```

## Regras de negócio

1. Nota mínima para aprovação: 70%
2. Colaborador pode refazer a prova quantas vezes quiser
3. Certificado só é gerado na primeira aprovação
4. Gabarito nunca é enviado ao frontend — só calculado no backend
5. Progresso do colaborador = (cursos concluídos / cursos obrigatórios do cargo) * 100

## Estrutura do certificado PDF

Usar @react-pdf/renderer. Layout:

- Logo da Rede Free (public/logo.png) centralizada no topo
- Título: "CERTIFICADO DE CONCLUSÃO" — grande, bold, laranja
- Corpo:
  "Certificamos que [NOME DO COLABORADOR], [CARGO],
  do posto [NOME DO POSTO], concluiu com aproveitamento
  o curso [NOME DO CURSO] com nota [NOTA]."
- Data de conclusão
- Linha de assinatura: "Responsável — Rede Free"
- Rodapé: código de verificação (attempt ID truncado)
- Borda decorativa laranja ao redor da página

## Estrutura do conteúdo NR-01

A NR-01 deve ser dividida em 4 módulos:

```typescript
const nr01Conteudo = [
  {
    ordem: 1,
    titulo: 'Introdução às Normas Regulamentadoras',
    tipo: 'TEXTO_RICO',
    conteudo: `# O que são as NRs?
As Normas Regulamentadoras (NRs) são regras obrigatórias estabelecidas pelo 
Ministério do Trabalho para garantir a segurança e saúde dos trabalhadores...`
  },
  {
    ordem: 2,
    titulo: 'PGR — Programa de Gerenciamento de Riscos',
    tipo: 'TEXTO_RICO',
    conteudo: `# O que é o PGR?
O Programa de Gerenciamento de Riscos é obrigatório para todas as empresas...`
  },
  {
    ordem: 3,
    titulo: 'Vídeo: NR-01 na prática',
    tipo: 'VIDEO_YOUTUBE',
    conteudo: 'https://www.youtube.com/embed/VIDEO_ID'
  },
  {
    ordem: 4,
    titulo: 'Resumo e pontos importantes',
    tipo: 'TEXTO_RICO',
    conteudo: `# Pontos-chave para a prova...`
  }
];
```

## Questões da prova NR-01 (mínimo 10 questões)

Formato das alternativas (JSON):
```json
{
  "A": "texto da alternativa A",
  "B": "texto da alternativa B",
  "C": "texto da alternativa C",
  "D": "texto da alternativa D"
}
```

Gabarito: string com a letra correta ("A", "B", "C" ou "D")

## Regras que o Codex deve seguir neste módulo

1. Gabarito nunca retorna na API — só no backend no momento do cálculo
2. Certificado só é gerado se aprovado (nota >= 70)
3. SubmitProvaUseCase invalida queryKey ['trilha', colaboradorId] após aprovação
4. Usar a mesma arquitetura hexagonal do projeto (domain → application → infra → interface)
5. Seguir o mesmo padrão de container.ts para injeção de dependência
6. Rotas de API seguem o mesmo padrão de autenticação (getSession + handleApiError)

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