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
name: free-safe-components
description: Use esta skill ao criar componentes reutilizáveis do FREE SAFE: cards, tabelas, formulários, badges, progress bars e modais. Todos os componentes seguem o visual do protótipo original com Tailwind + shadcn/ui.
---

# FREE SAFE — Componentes Reutilizáveis

## Tokens de design

```
Cor primária:     orange-500 (#f97316)
Cor primária dark: orange-600 (#ea580c)
Fundo da app:     zinc-100
Cards:            bg-white border border-zinc-200 rounded-2xl shadow-sm
Sidebar:          bg-zinc-950
Texto principal:  zinc-950
Texto secundário: zinc-500
Sucesso:          emerald-500
Erro:             red-500
Atenção:          amber-500
```

## Badge

```typescript
// src/components/ui/badge-status.tsx
type Tone = 'green' | 'yellow' | 'red' | 'orange' | 'dark' | 'default';

const toneClasses: Record<Tone, string> = {
  default: 'bg-zinc-100 text-zinc-700',
  green:   'bg-emerald-100 text-emerald-700',
  yellow:  'bg-amber-100 text-amber-800',
  red:     'bg-red-100 text-red-700',
  orange:  'bg-orange-100 text-orange-700',
  dark:    'bg-zinc-800 text-white',
};

export function BadgeStatus({ children, tone = 'default' }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
```

## Card

```typescript
// src/components/ui/card-base.tsx
export function CardBase({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
```

## StatCard

```typescript
// src/components/dashboard/stat-card.tsx
import type { LucideIcon } from 'lucide-react';
import { CardBase } from '@/components/ui/card-base';

type Tone = 'orange' | 'green' | 'yellow' | 'red';

const toneClasses: Record<Tone, string> = {
  orange: 'bg-orange-50 text-orange-600',
  green:  'bg-emerald-50 text-emerald-600',
  yellow: 'bg-amber-50 text-amber-600',
  red:    'bg-red-50 text-red-600',
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  tone?: Tone;
}

export function StatCard({ title, value, subtitle, icon: Icon, tone = 'orange' }: StatCardProps) {
  return (
    <CardBase>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-zinc-950">{value}</h3>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
        <div className={`rounded-2xl p-3 ${toneClasses[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardBase>
  );
}
```

## ProgressBar

```typescript
// src/components/ui/progress-bar.tsx
export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-zinc-100">
      <div
        className="h-2 rounded-full bg-orange-500 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
```

## PageHeader

```typescript
// src/components/layout/page-header.tsx
import { ShieldCheck, Download, Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  onNew?: () => void;
  onExport?: () => void;
  newLabel?: string;
}

export function PageHeader({ title, subtitle, onNew, onExport, newLabel = 'Novo registro' }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-600">
          <ShieldCheck className="h-4 w-4" /> FREE SAFE
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">{title}</h1>
        <p className="mt-1 text-zinc-500">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            <Download className="h-4 w-4" /> Exportar
          </button>
        )}
        {onNew && (
          <button
            onClick={onNew}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" /> {newLabel}
          </button>
        )}
      </div>
    </div>
  );
}
```

## LoadingSpinner

```typescript
// src/components/ui/loading-spinner.tsx
export function LoadingSpinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
}
```

## ErrorState

```typescript
// src/components/ui/error-state.tsx
import { AlertTriangle } from 'lucide-react';

export function ErrorState({ message = 'Erro ao carregar dados.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-600">
      <AlertTriangle className="h-10 w-10" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
```

## EmptyState

```typescript
// src/components/ui/empty-state.tsx
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-400">
      <Icon className="h-12 w-12" />
      <p className="text-lg font-semibold text-zinc-600">{title}</p>
      <p className="text-sm text-center max-w-xs">{description}</p>
      {action}
    </div>
  );
}
```

## ResultadoRAQ — componente de resultado da análise

```typescript
// src/components/raq/resultado-raq.tsx
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface ResultadoRAQProps {
  aprovado: boolean;
  produto: string;
  isEtanol: boolean;
  isGasolina: boolean;
}

export function ResultadoRAQ({ aprovado, produto, isEtanol, isGasolina }: ResultadoRAQProps) {
  return (
    <div className={`rounded-2xl p-4 ${aprovado ? 'bg-emerald-500/15 text-emerald-200' : 'bg-red-500/15 text-red-200'}`}>
      <div className="flex items-center gap-2 font-bold">
        {aprovado
          ? <CheckCircle2 className="h-5 w-5" />
          : <AlertTriangle className="h-5 w-5" />
        }
        {aprovado ? 'Aprovado' : 'Reprovado'}
      </div>
      <p className="mt-1 text-sm">
        {isEtanol
          ? aprovado
            ? 'Teor alcoólico dentro da faixa configurada de 92,5 a 95,4 INPM.'
            : 'Teor alcoólico fora da faixa configurada.'
          : isGasolina
          ? aprovado
            ? 'Teor de etanol e aspecto/cor dentro dos parâmetros.'
            : 'Verificar teor de etanol, aspecto ou cor.'
          : aprovado
          ? 'Densidade dentro dos parâmetros ANP.'
          : 'Densidade fora dos parâmetros ANP.'}
      </p>
    </div>
  );
}
```

## Regras que o Codex deve seguir nos componentes

1. Todo componente exporta como named export (`export function X`) — nunca default em componentes reutilizáveis
2. Props tipadas com interface explícita
3. Classes Tailwind sem interpolação de string dinâmica — use objetos de mapeamento (como `toneClasses`)
4. Loading state sempre com o spinner laranja (`border-orange-500`)
5. Sem `console.log` em componentes de produção
6. Componentes de UI puros (sem fetch) ficam em `src/components/ui/`
7. Componentes com dados de domínio ficam em `src/components/{modulo}/`
8. Nunca usar `style={{ color: 'orange' }}` — sempre classes Tailwind



# SKILL: Auditoria e Log de Ações — FREE SAFE

Skill de contexto para o Codex implementar e manter o sistema de auditoria do FREE SAFE de forma **consistente** em todos os módulos. Auditoria é requisito de compliance: todo sistema vendido para controle de postos precisa responder "quem fez o quê, quando e em qual posto".

> **Princípio central:** a auditoria NUNCA bloqueia a operação. Se o registro de log falhar, a ação principal já aconteceu e não deve ser revertida. Log é efeito colateral, não pré-condição.

---

## 1. Arquitetura (segue a hexagonal do projeto)

```
domain/
  entities/audit-log.entity.ts          → entidade + tipos de ação/recurso
  ports/audit-log.repository.ts          → porta (interface) do repositório
application/
  shared/audit.ts                        → serviço central registrarAuditoria()
infrastructure/
  database/prisma/repositories/audit-log.prisma-repository.ts
interface (rotas):
  app/api/auditoria/route.ts             → GET lista filtrável (só ADMIN)
  app/api/auditoria/export/route.ts      → PDF/Excel (opcional, fase posterior)
```

Registro via `container.ts` (factory functions), igual aos outros repositórios.

---

## 2. Schema Prisma

Adicionar ao `prisma/schema.prisma`:

```prisma
enum AuditAcao {
  CRIAR
  EDITAR
  EXCLUIR
  LOGIN
  LOGOUT
  EXPORTAR
}

enum AuditRecurso {
  AFERICAO
  BOMBA
  RAQ
  DOCUMENTO
  COLABORADOR
  USUARIO
  CURSO
  CERTIFICADO
  CATEGORIA
}

model AuditLog {
  id          String       @id @default(uuid())
  usuarioId   String?      @map("usuario_id")        // quem fez (null se sistema)
  usuarioNome String       @map("usuario_nome") @db.VarChar(150) // snapshot do nome
  usuarioEmail String      @map("usuario_email") @db.VarChar(200) // snapshot
  perfil      String       @db.VarChar(30)           // snapshot do perfil
  acao        AuditAcao
  recurso     AuditRecurso
  entidadeId  String?      @map("entidade_id")       // id do registro afetado
  postoId     String?      @map("posto_id")          // posto afetado
  descricao   String       @db.VarChar(300)          // texto legível: "Excluiu aferição do bico 3"
  detalhes    String?      @db.Text                  // JSON serializado opcional (antes/depois)
  ip          String?      @db.VarChar(60)
  criadoEm    DateTime     @default(now()) @map("criado_em")

  @@index([postoId, criadoEm])
  @@index([usuarioId, criadoEm])
  @@index([recurso, acao])
  @@map("audit_logs")
}
```

**Notas importantes:**
- `usuarioNome/Email/perfil` são **snapshots** (texto), não relações. Assim o log sobrevive mesmo se o usuário for editado/desativado depois. Auditoria é histórico imutável.
- `entidadeId` e `postoId` são `String?` porque algumas ações não têm posto (ex: login).
- `detalhes` em `@db.Text` (não VarChar) — pode guardar JSON grande sem erro P2000.
- Índices cobrem as três consultas mais comuns: por posto+data, por usuário+data, por tipo.

Após adicionar: rodar `npx prisma migrate dev --name add_audit_log` + `npx prisma generate` + reiniciar servidor (o Anthony roda manualmente; o Codex NÃO roda node/npm).

---

## 3. Entidade e porta

`src/domain/entities/audit-log.entity.ts`:
```ts
export type AuditAcao = 'CRIAR' | 'EDITAR' | 'EXCLUIR' | 'LOGIN' | 'LOGOUT' | 'EXPORTAR';
export type AuditRecurso =
  | 'AFERICAO' | 'BOMBA' | 'RAQ' | 'DOCUMENTO' | 'COLABORADOR'
  | 'USUARIO' | 'CURSO' | 'CERTIFICADO' | 'CATEGORIA';

export interface AuditLog {
  id: string;
  usuarioId?: string | null;
  usuarioNome: string;
  usuarioEmail: string;
  perfil: string;
  acao: AuditAcao;
  recurso: AuditRecurso;
  entidadeId?: string | null;
  postoId?: string | null;
  descricao: string;
  detalhes?: string | null;
  ip?: string | null;
  criadoEm: Date;
}
```

`src/domain/ports/audit-log.repository.ts`:
```ts
import type { AuditLog } from '../entities/audit-log.entity';

export interface RegistrarAuditoriaInput {
  usuarioId?: string | null;
  usuarioNome: string;
  usuarioEmail: string;
  perfil: string;
  acao: AuditLog['acao'];
  recurso: AuditLog['recurso'];
  entidadeId?: string | null;
  postoId?: string | null;
  descricao: string;
  detalhes?: string | null;
  ip?: string | null;
}

export interface ListarAuditoriaFiltro {
  postoId?: string;
  usuarioId?: string;
  recurso?: AuditLog['recurso'];
  acao?: AuditLog['acao'];
  dataInicio?: Date;
  dataFim?: Date;
  limite?: number;
  offset?: number;
}

export interface AuditLogRepository {
  registrar(input: RegistrarAuditoriaInput): Promise<void>;
  listar(filtro: ListarAuditoriaFiltro): Promise<{ itens: AuditLog[]; total: number }>;
}
```

---

## 4. Serviço central (o coração da skill)

`src/application/shared/audit.ts`:
```ts
import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import type { RegistrarAuditoriaInput } from '@/domain/ports/audit-log.repository';
import { auditLogRepository } from '@/lib/container';

type RegistrarParams = {
  usuario: UsuarioAutenticado;
  acao: RegistrarAuditoriaInput['acao'];
  recurso: RegistrarAuditoriaInput['recurso'];
  descricao: string;
  entidadeId?: string | null;
  postoId?: string | null;
  detalhes?: unknown;          // objeto será serializado
  ip?: string | null;
};

/**
 * Registra uma ação no log de auditoria.
 * NUNCA lança erro para o chamador: se o log falhar, apenas loga no console.
 * A ação principal do usuário não pode ser revertida por falha de auditoria.
 */
export async function registrarAuditoria(params: RegistrarParams): Promise<void> {
  try {
    await auditLogRepository().registrar({
      usuarioId: params.usuario.id,
      usuarioNome: params.usuario.nome,
      usuarioEmail: params.usuario.email,
      perfil: params.usuario.perfil,
      acao: params.acao,
      recurso: params.recurso,
      entidadeId: params.entidadeId ?? null,
      postoId: params.postoId ?? null,
      descricao: params.descricao,
      detalhes: params.detalhes ? JSON.stringify(params.detalhes) : null,
      ip: params.ip ?? null,
    });
  } catch (error) {
    console.error('[auditoria] falha ao registrar log:', error);
    // silencioso de propósito — não relança
  }
}
```

---

## 5. Como integrar nos use cases (PADRÃO OBRIGATÓRIO)

Chamar `registrarAuditoria` **DEPOIS** da operação ter sucesso, **antes** de retornar. Usar `await` mas lembrar que o serviço nunca lança.

Exemplo em `delete-afericao.use-case.ts`:
```ts
async execute(input: DeleteAfericaoInput): Promise<void> {
  const afericao = await this.afericaoRepo.buscarPorId(input.afericaoId);
  if (!afericao) throw new NotFoundError('Aferição não encontrada');

  autorizar(input.usuario, 'inmetro', 'excluir', afericao.postoId);

  await this.afericaoRepo.excluir(input.afericaoId);

  // AUDITORIA — sempre depois do sucesso
  await registrarAuditoria({
    usuario: input.usuario,
    acao: 'EXCLUIR',
    recurso: 'AFERICAO',
    entidadeId: input.afericaoId,
    postoId: afericao.postoId,
    descricao: `Excluiu aferição do bico ${afericao.bico} (bomba ${afericao.bomba})`,
    detalhes: { resultadoMl: afericao.resultadoMl, situacao: afericao.situacao },
  });
}
```

**Descrições devem ser legíveis por humano não-técnico** (é o cliente que vai ler):
- ✅ "Criou documento 'Alvará 2026' na categoria Licenças"
- ✅ "Desativou o usuário João Silva (gerente)"
- ❌ "POST /api/documentos id=abc-123"

### Ações que DEVEM ser auditadas (mínimo para 1.0):
| Recurso | Ações |
|---|---|
| AFERICAO | CRIAR (lote), EXCLUIR (individual e lote) |
| RAQ | CRIAR, EXCLUIR |
| DOCUMENTO | CRIAR, EXCLUIR |
| COLABORADOR | CRIAR, EDITAR, EXCLUIR |
| USUARIO | CRIAR, EDITAR (perfil/posto/senha), EXCLUIR (desativar) |
| BOMBA | CRIAR, EXCLUIR, CONFIGURAR |
| CERTIFICADO | EXPORTAR (emissão) |

Leituras (GET/listagens) **não** são auditadas no 1.0 — geraria ruído. Só ações que mudam estado.

---

## 6. Repositório Prisma

`src/infrastructure/database/prisma/repositories/audit-log.prisma-repository.ts`:
- `registrar`: simples `db.auditLog.create({ data })`.
- `listar`: monta `where` dinâmico a partir do filtro (postoId, usuarioId, recurso, acao, criadoEm com gte/lte), ordena por `criadoEm desc`, aplica `take`/`skip` (paginação), retorna `{ itens, total }` com `db.auditLog.count` para o total.
- Default de `limite`: 50. Nunca retornar tudo sem paginação.

---

## 7. Rota de consulta (só ADMIN)

`src/app/api/auditoria/route.ts`:
- `GET` com query params: `postoId`, `usuarioId`, `recurso`, `acao`, `dataInicio`, `dataFim`, `pagina`.
- Autoriza com `autorizar(usuario, 'auditorias', 'ver')` — só ADMIN tem na matriz.
- Use case `ListAuditoriaUseCase` aplica o filtro e retorna `{ data: { itens, total, pagina } }`.
- Validação Zod dos params.

---

## 8. Tela de auditoria

`src/app/(dashboard)/auditoria/page.tsx` (ou reusar a aba "Auditorias" da sidebar):
- Protegida com `<RouteGuard recurso="auditorias">` (só ADMIN).
- Visual clean do design system (cabeçalho card branco, faixa de filtros orange-50/50).
- Filtros: posto, usuário, tipo de recurso, tipo de ação, intervalo de datas.
- Lista/tabela: data-hora, usuário (nome+perfil em badge), ação (badge colorido por tipo), recurso, descrição legível, posto.
- Cores por ação: CRIAR (emerald), EDITAR (amber), EXCLUIR (red), LOGIN/LOGOUT (zinc), EXPORTAR (blue).
- Paginação no rodapé.
- Hook `use-auditoria.ts` com React Query, queryKey `['auditoria', filtros]`.

---

## 9. Captura de IP (opcional, melhora a auditoria)

Nas rotas, extrair o IP do header e passar para o use case:
```ts
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  ?? request.headers.get('x-real-ip') ?? null;
```
Passar `ip` no input do use case e repassar a `registrarAuditoria`. Se não quiser no 1.0, deixar `null` — o campo já é opcional.

---

## 10. Checklist de implementação

1. [ ] Schema: enums + model AuditLog + índices
2. [ ] Migration `add_audit_log` (Anthony roda)
3. [ ] Entidade + porta
4. [ ] Repositório Prisma + registrar no container
5. [ ] Serviço `registrarAuditoria` (nunca lança)
6. [ ] Integrar nas ações da tabela do item 5 (criar/excluir/editar)
7. [ ] Rota GET /api/auditoria (só ADMIN) + use case de listagem
8. [ ] Tela de auditoria com filtros + paginação
9. [ ] (Opcional) captura de IP
10. [ ] (Fase posterior) export PDF/Excel do log

---

## 11. Erros recorrentes a evitar

- **NÃO** fazer `registrarAuditoria` lançar erro — quebra a operação principal.
- **NÃO** usar VarChar em `detalhes` — JSON estoura; usar `@db.Text`.
- **NÃO** auditar leituras (GET) — só mudanças de estado.
- **NÃO** usar relação Prisma para o usuário do log — usar snapshots de texto (histórico imutável).
- **SEMPRE** registrar DEPOIS do sucesso da operação, nunca antes.
- Após migration: `npx prisma generate` + reiniciar servidor, senão "Unknown argument" / enum não reconhecido.


