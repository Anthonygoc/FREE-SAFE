# SKILL: RAQ — Regras de Aprovação por Produto

> Fonte de verdade das regras de análise de qualidade (ANP) do FREE SAFE.
> Contexto: Rede Free são postos revendedores. Aplicam-se os limites de
> **revenda** da Resolução ANP nº 907/2022, não os de produção.
 
---

## 1. Princípio inegociável

**A regra de aprovação existe em UM lugar só: `raq.entity.ts`.**

Auditoria de julho/2026 encontrou a mesma regra escrita em três lugares
divergentes (entidade, prévia da UI, helper de rótulos). Isso fazia a tela
mostrar "aprovado" e o sistema salvar "reprovado".

- A UI **nunca** reimplementa a regra — ela importa e chama a função do domínio.
- Se a prévia precisa do resultado, ela chama o mesmo código que o backend usa.
- Rótulos de texto (cor/aspecto por produto) ficam em `especificacoes-raq.ts` e
  são só apresentação — não participam do cálculo.
---

## 2. Unidade: kg/m³ (não g/cm³)

Toda massa específica e densidade no RAQ é expressa em **kg/m³**.

- `815,0` — correto
- `0,815` — errado (é a unidade antiga, g/cm³)
  A conversão é `g/cm³ × 1000 = kg/m³`. A tela deve pedir kg/m³, o PDF e o Excel
  devem imprimir com a unidade explícita, e os limites do domínio são em kg/m³.

---

## 3. O campo certo para cada checagem

Existem três campos numéricos parecidos e é fácil trocar um pelo outro:

| Campo | O que é | Usado na regra? |
|---|---|---|
| `densidadeObservada` | leitura do densímetro na temperatura ambiente | **NÃO** — nunca validar |
| `temperaturaObservada` | temperatura da amostra no momento da leitura | não (é registro) |
| `massa20c` | massa específica **corrigida para 20°C** | **SIM** — é esta que a ANP especifica |

O operador faz a correção de temperatura manualmente (tabela do densímetro) e
digita o `massa20c`. O sistema **não** calcula essa correção.

> Bug histórico: o diesel validava `densidadeObservada` contra limites que são de
> massa específica a 20°C. Valores diferentes, comparação inválida.
 
---

## 4. Regra de aprovação

Para **APROVAR**, todas as condições do produto devem ser verdadeiras.
Qualquer uma falhando → `REPROVADO`.

### Portão comum (todos os produtos)

```
aspecto === 'LIQUIDO_E_ISENTO'  E  cor === 'CARACTERISTICA'
```

Se qualquer um falhar, reprova imediatamente — nem avalia o resto.
Aspecto ou cor alterados indicam contaminação/adulteração.

### Gasolina comum e aditivada (`GASOLINA_COMUM`, `GASOLINA_ADITIVADA`)

- massa específica a 20°C (`massa20c`) **≥ 715,0 kg/m³** (só mínimo, sem máximo)
- teor de etanol anidro entre **29,0% e 31,0%**
### Gasolina premium (`GASOLINA_PREMIUM`)

- massa específica a 20°C (`massa20c`) **≥ 715,0 kg/m³**
- teor de etanol anidro entre **24,0% e 26,0%**
### Etanol hidratado — AEHC (`ETANOL_HIDRATADO`)

- massa específica a 20°C (`massa20c`) entre **805,2 e 811,2 kg/m³**
- teor alcoólico (`teorAlcoolico`) entre **92,5 e 94,6 °INPM**
> Os dois limites são a mesma restrição escrita de duas formas — °INPM é teor em
> massa, e etanol é menos denso que água, então mais álcool = menor densidade.
> 92,5 °INPM ↔ 811,2 kg/m³ e 94,6 °INPM ↔ 805,2 kg/m³. **Nunca misturar valores
> de tabelas diferentes** (a tabela de produção usa 92,5–95,4 / 802,9–811,2).

### Diesel S10 (`DIESEL_S10`)

- massa específica a 20°C (`massa20c`) entre **815,0 e 853,0 kg/m³**
### Diesel S500 (`DIESEL_S500`)

- massa específica a 20°C (`massa20c`) entre **815,0 e 865,0 kg/m³**
---

## 5. Teor de etanol na gasolina — fórmula

Ensaio da proveta: 50 mL de gasolina + 50 mL de solução aquosa, agita, lê o
volume da fase aquosa.

```
teorEtanol (%) = (faseAquosa − 50) × 2
```

**Sem fator de correção.** (Havia um `+ 1` no código que deslocava tudo em 1
ponto percentual: gasolina E30 conforme dava 31% e ficava na beirada da
reprovação. Foi removido em julho/2026.)

O operador digita a **fase aquosa em mL**. O teor em % é calculado e exibido
como campo somente-leitura — nunca digitado.
 
---

## 6. Rótulos por produto (apresentação, não cálculo)

Ficam em `especificacoes-raq.ts`. O valor persistido continua sendo o enum
(`LIQUIDO_E_ISENTO` / `CARACTERISTICA`); só o texto exibido muda por produto.

### Aspecto — texto de `LIQUIDO_E_ISENTO`

| Produto | Texto |
|---|---|
| Etanol | Límpido e isento de impurezas |
| Gasolina (todas) | Homogêneo, límpido e isento de impurezas |
| Diesel (S10 e S500) | Homogêneo, límpido e isento de material particulado |

### Cor — texto de `CARACTERISTICA`

| Produto | Texto |
|---|---|
| Etanol | Incolor |
| Gasolina (todas) | De incolor a amarelada |
| Diesel S10 | Amarelo |
| Diesel S500 | Vermelho |

Valores não conformes mantêm rótulo genérico: aspecto `TURVO` / `COM_IMPUREZAS`,
cor `ALTERADA`.
 
---

## 7. Os 6 produtos devem estar na tela

O enum tem 6 valores e cada um tem regra própria. A tela precisa oferecer os 6 —
não agrupar em "Gasolina / Etanol / Diesel".

```
GASOLINA_COMUM · GASOLINA_ADITIVADA · GASOLINA_PREMIUM
ETANOL_HIDRATADO · DIESEL_S10 · DIESEL_S500
```

> Bug histórico: a tela oferecia 3 botões e mapeava Gasolina→`GASOLINA_COMUM`,
> Diesel→`DIESEL_S10`. `DIESEL_S500`, `GASOLINA_PREMIUM` e `GASOLINA_ADITIVADA`
> eram inalcançáveis, e suas regras nunca rodavam.

Os campos exibidos devem depender do produto:
- gasolina → fase aquosa (mL) + massa específica 20°C
- etanol → teor alcoólico (°INPM) + massa específica 20°C
- diesel → massa específica 20°C
---

## 8. Histórico não é recalculado

RAQs já gravadas mantêm a `situacao` que tinham. Mudança de regra vale só para
análises novas — mesma política da tolerância INMETRO.

A **conversão de unidade** (g/cm³ → kg/m³) é exceção: é o mesmo valor físico
escrito de outro jeito, então os registros antigos são convertidos (× 1000) para
não exibirem número sem sentido.
 
---

## 9. O que NÃO fazer

- ❌ Duplicar a regra na UI — importar do domínio
- ❌ Validar `densidadeObservada` — a regra é sobre `massa20c`
- ❌ Usar g/cm³ em qualquer lugar novo
- ❌ Adicionar correção à fórmula do teor de etanol
- ❌ Misturar limites da tabela de produção com os de revenda
- ❌ Recalcular a `situacao` de RAQs antigas
- ❌ Espalhar textos de cor/aspecto pelas telas — centralizar em `especificacoes-raq.ts`
---

## 10. Origem dos números

Resolução ANP nº 907/2022, limites de **revenda** (o posto é revendedor; a nota
da resolução estabelece limites distintos para importação, distribuição e
revenda). Confirmado com a P.O. em julho/2026.

Se a ANP atualizar a norma, os limites deste documento e os literais em
`raq.entity.ts` mudam juntos.


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