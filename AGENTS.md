---





















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