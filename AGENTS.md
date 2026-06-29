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
> 
> ---
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