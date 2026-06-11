---
name: free-safe-documentos
description: Use esta skill ao criar ou modificar o módulo de Documentos do FREE SAFE. Cobre categorias dinâmicas de documentos por posto, upload de arquivos em base64, controle de vencimento e a tela de documentos agrupados por categoria.
---

# FREE SAFE — Módulo de Documentos (Categorias Dinâmicas)

## Contexto do negócio

Cada posto da Rede Free precisa guardar documentos obrigatórios: contrato com
distribuidora, alvará de funcionamento, certificado da ANP, AVCB do bombeiro,
licença SEMA, croqui/planta baixa, e outros.

O gerente/admin precisa:
1. Entrar num posto e ver TODOS os documentos dele agrupados por categoria
2. Criar categorias novas digitando o nome (ex: "SEMA Publicitário", "Outorga")
3. Fazer upload do arquivo (PDF ou imagem)
4. Registrar data de vencimento e ser alertado quando estiver perto de vencer

## Decisão de arquitetura — Categorias dinâmicas

Em vez do enum fixo TipoDocumento, usamos uma tabela CategoriaDocumento.
Isso permite que o gerente crie categorias sob demanda sem mudar código.

A categoria é GLOBAL (compartilhada entre postos) com nome único.
Assim "SEMA" criada num posto fica disponível para todos, evitando duplicação.

## Schema Prisma

```prisma
model CategoriaDocumento {
  id         String      @id @default(uuid())
  nome       String      @unique @db.VarChar(120)
  descricao  String?     @db.VarChar(300)
  criadoEm  DateTime     @default(now()) @map("criado_em")

  documentos Documento[]

  @@map("categorias_documento")
}
```

Alterar o model Documento — substituir o enum tipo por categoriaId:
```prisma
model Documento {
  id             String          @id @default(uuid())
  postoId        String          @map("posto_id")
  categoriaId    String          @map("categoria_id")
  titulo         String          @db.VarChar(200)
  numero         String?         @db.VarChar(100)
  dataEmissao    DateTime?       @map("data_emissao") @db.Date
  dataVencimento DateTime?       @map("data_vencimento") @db.Date
  arquivoUrl     String?         @map("arquivo_url") @db.Text
  status         StatusDocumento @default(VALIDO)
  criadoEm      DateTime         @default(now()) @map("criado_em")
  atualizadoEm  DateTime         @updatedAt @map("atualizado_em")

  posto     Posto              @relation(fields: [postoId], references: [id])
  categoria CategoriaDocumento @relation(fields: [categoriaId], references: [id])

  @@map("documentos")
}
```

IMPORTANTE: arquivoUrl muda de VarChar(500) para Text porque base64 é grande.

## Categorias iniciais (seed)

```typescript
const categoriasIniciais = [
  'Contrato com Distribuidora',
  'Alvará de Funcionamento',
  'Certificado ANP',
  'Alvará do Bombeiro / AVCB',
  'Licença Ambiental / SEMA',
  'Croqui / Planta Baixa',
  'Inscrição Estadual',
  'CNPJ',
  'Outorga de Água',
];
```

## Upload em base64

Seguir o mesmo padrão do módulo INMETRO:

```typescript
const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result ?? ''));
  reader.onerror = () => reject(new Error('Falha ao carregar arquivo'));
  reader.readAsDataURL(file);
});
```

O arquivo vai como data URL no campo arquivoUrl (aceita PDF e imagem).

## Ports do domínio

```typescript
// src/domain/ports/categoria-documento.repository.ts
export interface CategoriaDocumento {
  id: string;
  nome: string;
  descricao?: string;
  criadoEm: Date;
}

export interface CategoriaDocumentoRepository {
  listarTodas(): Promise<CategoriaDocumento[]>;
  buscarPorNome(nome: string): Promise<CategoriaDocumento | null>;
  buscarPorId(id: string): Promise<CategoriaDocumento | null>;
  salvar(categoria: CategoriaDocumento): Promise<void>;
}
```

## Rotas de API

```
GET  /api/categorias-documento          → lista todas as categorias
POST /api/categorias-documento          → cria categoria nova (ou retorna existente se nome já existe)
GET  /api/documentos?postoId=xxx        → lista documentos do posto com categoria
POST /api/documentos                    → cria documento (com upload base64)
DELETE /api/documentos/[id]             → remove documento
GET  /api/documentos/[id]/arquivo       → retorna o arquivo para download/visualização
```

## Cálculo de status do documento

```typescript
function calcularStatus(dataVencimento?: Date): StatusDocumento {
  if (!dataVencimento) return 'VALIDO';
  const hoje = new Date();
  const diasRestantes = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  if (diasRestantes < 0) return 'VENCIDO';
  if (diasRestantes <= 30) return 'VENCENDO';
  return 'VALIDO';
}
```

## Tela de documentos — fluxo

1. Select de posto no topo
2. Botão "Adicionar documento" abre modal
3. Modal de upload:
    - Select de categoria existente OU campo "Nova categoria" (texto livre)
    - Se digitar nova categoria, cria via POST /api/categorias-documento
    - Título do documento (ex: "Alvará 2026")
    - Número (opcional)
    - Data de emissão (opcional)
    - Data de vencimento (opcional)
    - Upload de arquivo (PDF ou imagem) → base64
4. Documentos exibidos AGRUPADOS por categoria:
    - Cabeçalho da categoria (ex: "Licença Ambiental / SEMA")
    - Cards dos documentos daquela categoria
    - Cada card: título, número, vencimento, badge de status, botão visualizar/baixar
5. Alerta no topo se houver documentos vencendo em 30 dias

## Regras que o Codex deve seguir

1. Categoria é criada se não existir, ou reutilizada se o nome já existe (case-insensitive)
2. Status é calculado automaticamente pela data de vencimento
3. Upload é base64 (data URL), aceita PDF e imagem
4. Documentos sempre agrupados por categoria na tela
5. Só ADMIN e GERENTE podem criar/deletar; gerente só no próprio posto
6. Seguir arquitetura hexagonal (domain → application → infra → interface)
7. Para visualizar o arquivo, abrir o data URL em nova aba ou renderizar inline

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