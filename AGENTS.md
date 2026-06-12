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

