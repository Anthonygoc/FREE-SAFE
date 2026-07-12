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

---
name: free-safe-inmetro
description: Use esta skill ao criar ou modificar o módulo INMETRO do FREE SAFE. Cobre cadastro de bombas e bicos por posto, upload de fotos de aferição, auditoria com responsável e horário, e a tela de aferição com seleção de bomba/bico.
---

# FREE SAFE — Módulo INMETRO (Bombas e Bicos)

## Contexto do negócio

Cada posto tem bombas. Cada bomba tem bicos. Cada bico dispensa um produto específico.
A aferição INMETRO é feita bico a bico — o técnico mede 20 litros e registra a diferença em mL.

Exemplo real (Posto Cáceres):
- Bomba 01 → bicos 01 a 06 (Etanol, Gasolina, Diesel S10 alternados)
- Bomba 02 → bicos 07 a 14
- Bomba 03 → bicos 15 a 20
- Tanques: 1=Diesel S10 (20.000L), 2=Diesel S10 (10.000L), 3=Etanol (30.000L), etc.

## Schema Prisma — novas tabelas

```prisma
model Bomba {
  id        String   @id @default(uuid())
  postoId   String   @map("posto_id")
  numero    Int
  modelo    String?  @db.VarChar(100)
  ativo     Boolean  @default(true)
  criadoEm DateTime @default(now()) @map("criado_em")

  posto   Posto   @relation(fields: [postoId], references: [id])
  bicos   Bico[]

  @@unique([postoId, numero])
  @@map("bombas")
}

model Bico {
  id        String             @id @default(uuid())
  bombaId   String             @map("bomba_id")
  numero    Int
  produto   ProdutoCombustivel
  capacidade Float?
  ativo     Boolean            @default(true)
  criadoEm DateTime            @default(now()) @map("criado_em")

  bomba     Bomba      @relation(fields: [bombaId], references: [id])
  afericoes Afericao[]

  @@unique([bombaId, numero])
  @@map("bicos")
}
```

Alteração na tabela Afericao — adicionar campo bicoId e fotoUrl:
```prisma
model Afericao {
  // campos existentes mantidos
  bicoId    String?  @map("bico_id")
  fotoUrl   String?  @map("foto_url") @db.VarChar(500)

  bico Bico? @relation(fields: [bicoId], references: [id])
}
```

Adicionar relações reversas no model Posto:
```prisma
bombas Bomba[]
```

## Ports do domínio

```typescript
// src/domain/ports/bomba.repository.ts
export interface BombaRepository {
  listarPorPosto(postoId: string): Promise<Bomba[]>;
  buscarPorId(id: string): Promise<Bomba | null>;
  salvar(bomba: Bomba): Promise<void>;
}

// src/domain/ports/bico.repository.ts
export interface BicoRepository {
  listarPorBomba(bombaId: string): Promise<Bico[]>;
  buscarPorId(id: string): Promise<Bico | null>;
  salvar(bico: Bico): Promise<void>;
}
```

## Rotas de API

```
GET  /api/bombas?postoId=xxx          → lista bombas do posto com bicos
POST /api/bombas                      → cadastra bomba
GET  /api/bombas/[id]/bicos           → lista bicos da bomba
POST /api/bombas/[id]/bicos           → cadastra bico
POST /api/afericao/[id]/foto          → upload de foto da aferição
```

## Tela INMETRO — fluxo de seleção

1. Usuário seleciona o posto
2. Sistema carrega as bombas do posto (GET /api/bombas?postoId=)
3. Usuário seleciona a bomba (select populado)
4. Sistema carrega os bicos da bomba selecionada
5. Usuário seleciona o bico (select populado com número + produto)
6. Produto é preenchido automaticamente pelo bico selecionado
7. Usuário digita o resultado em mL
8. Usuário faz upload de foto (opcional)
9. Sistema salva e exibe resultado (dentro/fora)

## Auditoria

Cada aferição já salva `responsavelId` e `criadoEm`.
No histórico, exibir:
- Nome do responsável (join com tabela users)
- Data e hora formatada: DD/MM/AAAA às HH:MM
- Foto se houver (thumbnail clicável)

## Hook de bombas e bicos

```typescript
// src/hooks/use-bombas.ts
export function useBombasByPosto(postoId: string) {
  return useQuery({
    queryKey: ['bombas', postoId],
    queryFn: () => apiClient.get(`/api/bombas?postoId=${postoId}`),
    enabled: !!postoId,
  });
}

export function useBicosByBomba(bombaId: string) {
  return useQuery({
    queryKey: ['bicos', bombaId],
    queryFn: () => apiClient.get(`/api/bombas/${bombaId}/bicos`),
    enabled: !!bombaId,
  });
}
```

## Seed de exemplo (Posto Cáceres)

```typescript
// Estrutura real da imagem fornecida
const bombasCaceres = [
  {
    numero: 1,
    bicos: [
      { numero: 1, produto: 'ETANOL_HIDRATADO' },
      { numero: 2, produto: 'GASOLINA_COMUM' },
      { numero: 3, produto: 'DIESEL_S10' },
      { numero: 4, produto: 'ETANOL_HIDRATADO' },
      { numero: 5, produto: 'GASOLINA_COMUM' },
      { numero: 6, produto: 'DIESEL_S10' },
    ]
  },
  {
    numero: 2,
    bicos: [
      { numero: 7, produto: 'DIESEL_S10' },
      { numero: 8, produto: 'ETANOL_HIDRATADO' },
      { numero: 9, produto: 'DIESEL_S10' },
      { numero: 10, produto: 'ETANOL_HIDRATADO' },
      { numero: 11, produto: 'GASOLINA_COMUM' },
      { numero: 12, produto: 'DIESEL_S10' },
      { numero: 13, produto: 'ETANOL_HIDRATADO' },
      { numero: 14, produto: 'GASOLINA_COMUM' },
    ]
  },
  {
    numero: 3,
    bicos: [
      { numero: 15, produto: 'DIESEL_S500' },
      { numero: 16, produto: 'DIESEL_S10' },
      { numero: 17, produto: 'ETANOL_HIDRATADO' },
      { numero: 18, produto: 'GASOLINA_COMUM' },
      { numero: 19, produto: 'DIESEL_S500' },
      { numero: 20, produto: 'DIESEL_S10' },
    ]
  }
];
```

## Regras que o Codex deve seguir neste módulo

1. Quando um bico é selecionado, o produto é preenchido automaticamente — nunca deixar o usuário escolher produto manualmente
2. Foto é opcional mas recomendada — não bloquear o registro sem ela
3. Upload de foto vai para Supabase Storage em `afericao/{afericaoId}/foto.jpg`
4. Histórico sempre mostra nome do responsável + data/hora — nunca só o ID
5. Bomba e bico são selecionados via select populado pela API — nunca campo de texto livre
6. Seguir o mesmo padrão arquitetural do projeto (domain → application → infra → interface)
7. Usar o mesmo padrão de container.ts para injeção de dependência