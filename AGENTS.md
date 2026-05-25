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