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