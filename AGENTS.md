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