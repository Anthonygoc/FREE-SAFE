# DESIGN BRIEFING — FREE SAFE

Documento de referência visual e estrutural do projeto FREE SAFE, consolidado a partir do código real em `src/app`, `src/components` e `src/app/globals.css`. O objetivo é permitir a recriação fiel da interface em outra ferramenta, como Lovable, sem depender do JSX original.

## 1. Identidade visual

### Tom do design

O FREE SAFE adota um visual `clean corporativo laranja`. A base é neutra, clara e profissional, usando branco e zinc para quase toda a estrutura. O laranja aparece como cor de marca e direção visual: ações primárias, itens ativos, ícones de destaque, tags de contexto e painéis-resumo. O resultado não é um produto vibrante ou lúdico; é uma ferramenta administrativa e operacional com linguagem séria, confiável e de leitura rápida.

### Paleta de cores

#### Laranja de marca

Paleta derivada das classes Tailwind realmente usadas no projeto:

| Token | Hex | Uso recorrente |
| --- | --- | --- |
| `orange-50` | `#fff7ed` | fundos suaves de destaque, `IconBadge`, painéis informativos |
| `orange-100` | `#ffedd5` | bordas e fundos de estados ativos leves |
| `orange-200` | `#fed7aa` | bordas ativas e pills de apoio |
| `orange-300` | `#fdba74` | hover em áreas de upload e botões outline contextuais |
| `orange-400` | `#fb923c` | pouco usado diretamente |
| `orange-500` | `#f97316` | cor principal da marca, botões primários, navegação ativa, ícones |
| `orange-600` | `#ea580c` | hover do primário, ícones e textos de ação |
| `orange-700` | `#c2410c` | labels uppercase em painéis de contexto |

#### Neutros zinc

| Token | Hex | Uso recorrente |
| --- | --- | --- |
| `white` | `#ffffff` | cards, modais, header, inputs |
| `zinc-50` | `#fafafa` | cabeçalhos de tabela, superfícies secundárias |
| `zinc-100` | `#f4f4f5` | divisores, skeletons, fundos de apoio |
| `zinc-200` | `#e4e4e7` | bordas padrão |
| `zinc-300` | `#d4d4d8` | hover de borda, campos secundários |
| `zinc-400` | `#a1a1aa` | ícones e textos sutis |
| `zinc-500` | `#71717a` | subtítulos, metadados, labels auxiliares |
| `zinc-600` | `#52525b` | texto secundário mais forte |
| `zinc-700` | `#3f3f46` | labels, texto de corpo reforçado |
| `zinc-800` | `#27272a` | texto de ação neutro |
| `zinc-900` | `#18181b` | títulos de bloco e conteúdo forte |
| `zinc-950` | `#09090b` | sidebar, textos principais, botão escuro |

#### Cores semânticas

| Grupo | Token | Hex | Significado visual |
| --- | --- | --- | --- |
| `emerald` | `emerald-50` | `#ecfdf5` | fundo de sucesso |
| `emerald` | `emerald-100` | `#d1fae5` | badge e borda de sucesso |
| `emerald` | `emerald-200` | `#a7f3d0` | borda secundária |
| `emerald` | `emerald-500` | `#10b981` | preenchimento de progresso/indicador |
| `emerald` | `emerald-600` | `#059669` | ícone e texto de sucesso |
| `emerald` | `emerald-700` | `#047857` | textos fortes de aprovação |
| `amber` | `amber-50` | `#fffbeb` | fundo de atenção |
| `amber` | `amber-100` | `#fef3c7` | badge de atenção |
| `amber` | `amber-200` | `#fde68a` | borda de alerta leve |
| `amber` | `amber-500` | `#f59e0b` | progresso e destaque de atenção |
| `amber` | `amber-600` | `#d97706` | ícones e texto de atenção |
| `amber` | `amber-700` | `#b45309` | labels fortes |
| `amber` | `amber-800` | `#92400e` | tom mais escuro para badge amarelo |
| `red` | `red-50` | `#fef2f2` | fundo de erro |
| `red` | `red-100` | `#fee2e2` | badges e painéis de reprovação |
| `red` | `red-200` | `#fecaca` | bordas de erro |
| `red` | `red-500` | `#ef4444` | destaque semântico |
| `red` | `red-600` | `#dc2626` | ícones, texto e ações destrutivas |
| `red` | `red-700` | `#b91c1c` | texto forte de estado crítico |

#### Cor semântica adicional

`blue` aparece apenas em `BadgeStatus` para o perfil `ADMINISTRATIVO`:

| Token | Hex |
| --- | --- |
| `blue-50` | `#eff6ff` |
| `blue-100` | `#dbeafe` |
| `blue-500` | `#3b82f6` |
| `blue-600` | `#2563eb` |
| `blue-700` | `#1d4ed8` |

#### Tokens globais em `globals.css`

Os tokens base estão em OKLCH e correspondem visualmente à mesma família branca/zinc:

| Token global | Valor em `globals.css` | Equivalente visual |
| --- | --- | --- |
| `--background` | `oklch(1 0 0)` | `#ffffff` |
| `--foreground` | `oklch(0.145 0 0)` | próximo de `#09090b` |
| `--card` | `oklch(1 0 0)` | `#ffffff` |
| `--muted` | `oklch(0.97 0 0)` | próximo de `#f4f4f5` |
| `--muted-foreground` | `oklch(0.556 0 0)` | próximo de `#71717a` |
| `--border` | `oklch(0.922 0 0)` | próximo de `#e4e4e7` |
| `--input` | `oklch(0.922 0 0)` | próximo de `#e4e4e7` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | família `red-500/red-600` |

### Tipografia

#### Fontes usadas

- Fonte principal: `Geist`
- Fonte monoespaçada: `Geist Mono`
- `Manrope`: não está em uso no código atual

#### Escala tipográfica dominante

| Papel | Classe recorrente | Tamanho real |
| --- | --- | --- |
| Título de página | `text-2xl font-bold tracking-tight text-zinc-950` | 24px |
| Título de seção premium | `text-xl font-bold tracking-tight text-zinc-950` | 20px |
| Título de card/listagem | `text-base font-semibold text-zinc-900` | 16px |
| Corpo padrão | `text-sm text-zinc-600` ou `text-sm text-zinc-700` | 14px |
| Subtexto/metadado | `text-sm text-zinc-500` | 14px |
| Label de campo | `text-sm font-medium text-zinc-700` | 14px |
| Texto auxiliar | `text-xs text-zinc-500` | 12px |
| Label uppercase | `text-xs font-semibold uppercase tracking-[0.14em]` a `tracking-[0.18em]` | 12px |
| KPI principal | `text-3xl font-bold tabular-nums` | 30px |

#### Exceções relevantes

- Login usa títulos maiores (`text-3xl` e `text-5xl`) para criar um momento de marca.
- Alguns botões secundários pequenos usam `text-xs`.
- Todos os números importantes usam ou deveriam usar `tabular-nums`; isso já aparece em KPIs, contagens, percentuais e datas compactas.

### Tokens de forma, sombra e espaçamento

#### Raios

`globals.css` define `--radius: 0.625rem` (10px) e deriva:

| Token | Valor |
| --- | --- |
| `--radius-sm` | `0.375rem` / 6px |
| `--radius-md` | `0.5rem` / 8px |
| `--radius-lg` | `0.625rem` / 10px |
| `--radius-xl` | `0.875rem` / 14px |
| `--radius-2xl` | `1.125rem` / 18px |
| `--radius-3xl` | `1.375rem` / 22px |
| `--radius-4xl` | `1.625rem` / 26px |

Na prática visual do app:

- cards usuais: `rounded-2xl`
- hero cards de páginas: `rounded-[28px]`
- inputs e selects: `rounded-xl`
- botões primários e secundários: `rounded-xl`
- pills e badges: `rounded-full`
- upload areas e mini cards: `rounded-2xl`

#### Sombras

Sombras são discretas e sempre corporativas:

- card base: `shadow-sm`
- card clicável: `hover:shadow-md`
- navegação ativa da sidebar: `shadow-lg shadow-orange-500/20`
- sticky submit bar do INMETRO: `shadow-lg`
- modais: `shadow-xl`
- lightbox de imagem: `shadow-2xl`

#### Espaçamentos recorrentes

| Classe | Valor |
| --- | --- |
| `p-4` | 16px |
| `p-5` | 20px |
| `p-6` | 24px |
| `p-7` | 28px |
| `px-3 py-2.5` | 12px x 10px |
| `px-4 py-2.5` | 16px x 10px |
| `gap-3` | 12px |
| `gap-4` | 16px |
| `gap-5` | 20px |
| `gap-6` | 24px |
| `space-y-5` | 20px |
| `space-y-6` | 24px |
| `h-10` | 40px |
| `h-11` | 44px |
| `h-12` | 48px |
| `w-72` | 288px |

## 2. Layout global

### Estrutura macro

O layout autenticado é composto por três camadas fixas:

1. Sidebar fixa à esquerda.
2. Header sticky no topo da área principal.
3. Área de conteúdo com fundo `bg-zinc-100`, scroll vertical e cards brancos flutuando sobre esse fundo.

### Sidebar

- Estrutura fixa em desktop: `fixed inset-y-0 left-0 z-40 w-72 bg-zinc-950 border-r border-white/10`
- Conteúdo interno com `p-6`
- Marca no topo: quadrado `12x12` com `bg-orange-500`, letra `F`, tipografia forte e subtítulo `Compliance Operacional`
- Rodapé interno: card translúcido `rounded-2xl border border-white/10 bg-white/5`

#### Grupos de navegação

Os grupos são renderizados em uppercase pequeno, com `text-xs font-semibold uppercase tracking-wider text-zinc-500`.

- `PRINCIPAL`
  - Dashboard
- `OPERAÇÃO`
  - ANP / RAQ
  - INMETRO
  - Manutenção
  - Drenagem
- `PESSOAS`
  - Colaboradores
  - Treinamentos
  - Entrevistas
- `CONFORMIDADE`
  - Postos
  - Documentos
  - Auditorias
  - Relatórios
- `ADMINISTRAÇÃO`
  - Usuários
  - Este grupo aparece apenas para `ADMIN`

#### Item de navegação

- Base: `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-150`
- Ícone: `h-5 w-5`
- Ativo: `bg-orange-500 text-white shadow-lg shadow-orange-500/20`
- Inativo: `text-zinc-300 hover:bg-white/10`

### Header

- Estrutura: `sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur`
- Altura interna: `h-20`
- Padding horizontal: `px-5 lg:px-8`

#### Lado esquerdo

- Mobile: botão hambúrguer `h-10 w-10`, mini marca com quadrado laranja e texto `FREE SAFE`
- Desktop: barra de busca larga (`lg:min-w-[420px]`) com `rounded-2xl bg-zinc-100`, ícone `Search h-5 w-5`, foco com `focus-within:ring-2 focus-within:ring-orange-500/20`

#### Lado direito

- Botões de ação isolados: sino e configurações, ambos em `rounded-xl border border-zinc-200 bg-white p-2.5`
- CTA escuro de sessão: `rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white`

### Área de conteúdo

- Wrapper principal: `lg:pl-72` para compensar a sidebar fixa
- `main`: `p-5 lg:p-8`
- As páginas usam `space-y-6` como ritmo vertical padrão
- Os grandes blocos de topo normalmente usam cards `rounded-[28px] border border-zinc-200 bg-white shadow-sm`

### Comportamento responsivo

Breakpoints são os padrões do Tailwind:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

#### Padrões responsivos observados

- A sidebar só fica fixa em `lg+`
- Em telas menores ela vira drawer lateral com overlay escuro
- O drawer usa `AnimatePresence`, entra da esquerda e trava o scroll do `body`
- O header mostra busca completa apenas em `lg+`
- Muitas telas migram para duas colunas em `xl`, especialmente ANP e INMETRO, com trilho direito fixo de `320px`
- Tabelas do INMETRO trocam de grid desktop para empilhamento mobile por linha
- Tabelas simples como Colaboradores usam `overflow-x-auto`

## 3. Componentes base

Os componentes abaixo são os blocos-base reais em `src/components/ui`.

### `CardBase`

- Propósito: contêiner padrão de cards e blocos de conteúdo
- Props:
  - `children`
  - `className`
  - `interactive?: boolean`
  - `padding?: 'sm' | 'md' | 'lg'`
- Variações de padding:
  - `sm`: `p-4`
  - `md`: `p-5`
  - `lg`: `p-6`
- Classes visuais-base:
  - `rounded-2xl border border-zinc-200 bg-white shadow-sm`
- Estado interativo:
  - `cursor-pointer transition-all hover:border-zinc-300 hover:shadow-md`
  - hover animado com `whileHover={{ y: -2 }}`
- Entrada:
  - `initial={{ opacity: 0, y: 12 }}`
  - `animate={{ opacity: 1, y: 0 }}`

### `BadgeStatus`

- Propósito: badge semântico de status, perfil, prazo ou contagem
- Props:
  - `label: string`
  - `tone?: 'green' | 'yellow' | 'red' | 'orange' | 'dark' | 'default' | 'emerald' | 'blue'`
  - `icon?: LucideIcon`
  - `size?: 'sm' | 'md'`
- Classes-base:
  - `inline-flex rounded-full font-semibold`
- Tamanhos:
  - `sm`: `px-2.5 py-0.5 text-xs`
  - `md`: `px-3 py-1 text-sm`
- Ícone opcional:
  - `items-center gap-1.5`
  - ícone em `h-3.5 w-3.5`
- Tons:
  - `default`: `bg-zinc-100 text-zinc-700`
  - `green/emerald`: `bg-emerald-100 text-emerald-700`
  - `yellow`: `bg-amber-100 text-amber-800`
  - `red`: `bg-red-100 text-red-700`
  - `orange`: `bg-orange-100 text-orange-700`
  - `blue`: `bg-blue-100 text-blue-700`
  - `dark`: `bg-zinc-800 text-white`

### `PageHeader`

- Propósito: cabeçalho de página reutilizável com ícone, título, subtítulo e ação
- Props:
  - `title` ou `titulo`
  - `subtitle` ou `subtitulo`
  - `action` ou `acao`
  - `icon`
- Estrutura:
  - layout flex com ação alinhada à direita em desktop
  - usa `IconBadge` quando há ícone
- Classes-chave:
  - wrapper: `flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`
  - título: `text-2xl font-bold tracking-tight text-zinc-950`
  - subtítulo: `mt-1 text-sm text-zinc-500`
- Animação:
  - `initial={{ opacity: 0, y: 12 }}`
  - `animate={{ opacity: 1, y: 0 }}`

### `IconBadge`

- Propósito: cápsula de ícone com fundo tonal, usada em cabeçalhos, KPIs e resumos
- Props:
  - `icon`
  - `tone?: 'orange' | 'emerald' | 'amber' | 'red' | 'zinc' | 'green'`
  - `size?: 'sm' | 'md' | 'lg'`
- Classes-base:
  - `inline-flex rounded-xl`
- Tamanhos:
  - `sm`: `p-1.5`, ícone `h-4 w-4`
  - `md`: `p-2`, ícone `h-5 w-5`
  - `lg`: `p-2.5`, ícone `h-6 w-6`
- Tons:
  - `orange`: `bg-orange-50 text-orange-600`
  - `emerald/green`: `bg-emerald-50 text-emerald-600`
  - `amber`: `bg-amber-50 text-amber-600`
  - `red`: `bg-red-50 text-red-600`
  - `zinc`: `bg-zinc-100 text-zinc-600`

### `InputBase`

- Propósito: input textual padrão do sistema
- Props: qualquer `InputHTMLAttributes`
- Classe-base:

```txt
w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder:text-zinc-400
```

- Observações:
  - várias páginas adicionam `h-10` ou `h-11`
  - campos somente leitura usam `bg-zinc-100 text-zinc-500`

#### `TextareaInput`

- Mesmo visual do `InputBase`, aplicado em `<textarea>`

#### `FieldLabel`

- Classe-base: `mb-1.5 block text-sm font-medium text-zinc-700`

#### `FieldError`

- Classe-base: `mt-1 text-xs text-red-600`

### `SelectBase`

- Propósito: select padrão
- Props: qualquer `SelectHTMLAttributes`
- Classe-base:

```txt
w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20
```

- Uso recorrente com `h-10` ou `h-11`

### `ProgressBar`

- Propósito: barra horizontal para conformidade e progresso
- Props:
  - `value: number`
  - `tone?: 'orange' | 'emerald' | 'amber' | 'red'`
- Classes-base:
  - trilho: `w-full overflow-hidden rounded-full bg-zinc-100`
  - altura fixa em `6px`
- Cores reais do preenchimento:
  - orange: `#f97316`
  - emerald: `#10b981`
  - amber: `#f59e0b`
  - red: `#ef4444`
- Animação:
  - largura de `0` até o valor final em `0.8s`

### `LoadingSpinner`

- Propósito: spinner padrão de loading
- Props:
  - `size?: number` com default `20`
- Classe-base:
  - `inline-block animate-spin rounded-full border-2 border-orange-200 border-t-orange-500`
- Uso recorrente:
  - `size={30}` no centro das páginas
  - `size={18}` dentro de botões e modais

### `Skeleton`

- Propósito: placeholder de carregamento
- Props:
  - `className?`
- Classe-base:
  - `animate-pulse rounded-lg bg-zinc-100`

#### `SkeletonCard`

- Card branco com borda zinc, padding `p-5`, linhas e botões falsos

#### `SkeletonTable`

- Estrutura de grade com header e 5 linhas simuladas

### `Button`

- Propósito: primitive genérico baseado em `@base-ui/react/button`
- Observação importante: existe no design system, mas grande parte das páginas atuais usa classes inline próprias para seguir o laranja corporativo com mais fidelidade
- Variantes:
  - `default`
  - `outline`
  - `secondary`
  - `ghost`
  - `destructive`
  - `link`
- Sizes:
  - `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`
- Classe-base do primitive:
  - `inline-flex ... rounded-lg ... text-sm font-medium ... transition-all ... focus-visible:ring-3 ... disabled:opacity-50`
- Comportamento visual:
  - é mais neutro e shadcn-like que os botões principais do app
  - ícones internos padrão ficam em `size-4`

### `EmptyState`

- Propósito: estado vazio centralizado
- Props:
  - `icon`
  - `title`
  - `description`
  - `action?`
- Classes-base:
  - wrapper: `flex h-64 flex-col items-center justify-center gap-3`
  - círculo do ícone: `rounded-full bg-zinc-50 p-4`
  - ícone: `h-10 w-10 text-zinc-400`
  - título: `text-lg font-semibold text-zinc-700`
  - descrição: `max-w-xs text-center text-sm text-zinc-500`

## 4. Telas

### Dashboard

**Objetivo da tela**

Oferecer uma visão executiva da operação: KPIs, ranking de conformidade por posto e alertas críticos.

**Estrutura de layout**

A tela abre com um hero card largo, de cantos grandes (`rounded-[28px]`), contendo ícone, título, descrição e um painel-resumo laranja em grade de quatro células. Abaixo disso aparece uma grade de quatro cards KPI. O miolo se divide em duas colunas no `xl`: o ranking ocupa dois terços e a lista de alertas ocupa um terço.

**Componentes visuais**

- Hero com `IconBadge` laranja grande
- `StatCard` para KPIs
- `CardBase` para ranking e alertas
- `ProgressBar` para a conformidade de cada posto
- `BadgeStatus` para atualização diária e criticidade

**Padrões de interação**

Os cards têm entrada animada com stagger. Cada item do ranking sobe `-2px` no hover. O feedback é visual, sem modal. A leitura é fortemente apoiada por pills, números tabulares e pequenos rótulos uppercase.

**Estados**

- Loading: spinner central laranja
- Vazio de alertas: texto simples “Nenhum alerta no momento.”
- Erro: não há painel dedicado; falhas são tratadas pelas queries e pelo fluxo geral

### INMETRO

**Objetivo da tela**

Registrar aferições de bombas e bicos, validar tolerância por item e manter um histórico técnico exportável.

**Estrutura de layout**

A tela tem um hero card superior com seletor de posto, data e responsável. A seguir há uma composição em duas colunas no `xl`: à esquerda fica o formulário operacional por bomba; à direita, um resumo sticky de 320px. Abaixo desse bloco vem uma segunda grande seção: o histórico de aferições.

**Componentes visuais**

Cada bomba vira um `CardBase` com cabeçalho próprio e uma tabela/gride responsiva de bicos. Cada linha mostra número do bico, produto, input de resultado, badge de situação, upload/preview de foto e observação. Quando o valor está fora da tolerância, a linha recebe fundo avermelhado; quando está dentro, um laranja muito suave. No final da lista há uma barra sticky de submissão com gradiente laranja.

O trilho lateral direito resume preenchimento, quantidade dentro/fora, tolerância, total de bicos e status do lote. O histórico inferior usa cartões expansíveis em formato de accordion: cada lote tem cabeçalho, contadores, exportação PDF/Excel e exclusão; ao expandir, aparecem as aferições individuais.

**Padrões de interação**

- Upload de foto inline por bico
- Lightbox para ampliar imagem com overlay escuro
- Accordion com `ChevronDown` girando e animação de altura
- Botão de envio desabilitado até todos os bicos serem preenchidos
- Exportação de histórico via PDF e Excel
- Exclusões com `window.confirm`

**Estados**

- Loading inicial: spinner central
- Sem posto: card simples pedindo seleção
- Sem bombas: card simples informativo
- Histórico vazio: mensagem textual
- Erro: feedback por toast ou ausência de dados, sem tela de erro dedicada

### ANP / RAQ

**Objetivo da tela**

Registrar análises oficiais de qualidade de combustível, calcular resultado em tempo real e armazenar histórico de RAQs com exportação.

**Estrutura de layout**

A tela também começa com um hero card superior. Depois se organiza em duas colunas no `xl`: à esquerda fica um formulário longo dividido em três grandes seções (`Dados do posto`, `Recebimento e origem`, `Parâmetros técnicos`); à direita fica um card sticky de resumo e resultado. Abaixo, uma seção independente mostra o histórico de RAQs com filtros.

**Componentes visuais**

O topo reúne posto, razão social, CNPJ e endereço. A seção de produto usa três “tiles” selecionáveis para gasolina, etanol e diesel, cada um com ícone, estado ativo e borda destacada. Os campos de formulário são todos brancos com borda zinc e foco laranja. O card lateral usa `BadgeStatus`, pequenos cards informativos e painéis laranja/verde para observação operacional e último resultado salvo.

O histórico é uma lista vertical de cards brancos com hover, cada um contendo produto, badge de aprovado/reprovado, timestamp, nome do analista e botões pequenos de download.

**Padrões de interação**

- Formulário com `react-hook-form` + Zod
- Resultado recalculado em tempo real enquanto o usuário preenche
- Produto selecionado com card clicável, não com radio tradicional
- Exportação imediata do RAQ recém-criado
- Filtros por período, produto e resultado no histórico

**Estados**

- Loading: spinner central
- Histórico atualizando: spinner pequeno inline no cabeçalho
- Histórico vazio: texto simples
- Sucesso de gravação: card verde no resumo lateral com o último resultado
- Erros de validação: textos `text-xs text-red-600` abaixo dos campos

### Documentos

**Objetivo da tela**

Centralizar licenças, certificados e demais documentos obrigatórios por posto.

**Estrutura de layout**

Há um hero card superior com seletor de posto e botão primário para adicionar documento. O corpo da tela usa duas colunas em `xl`: uma sidebar interna de categorias à esquerda e a listagem dos arquivos à direita. A listagem é um grid de cards, normalmente em duas colunas no desktop largo.

**Componentes visuais**

A coluna esquerda usa `CardBase` com lista de filtros em formato de botão grande. O estado ativo da categoria troca para `border-orange-200 bg-orange-50 text-orange-700`. A coluna principal usa um cabeçalho com total de resultados, campo de busca com ícone à esquerda e filtro de status.

Cada documento é um card branco com ícone laranja, título, categoria, número, dois mini cards de data (`Emissão` e `Vencimento`) e ações de visualizar/excluir. O modal de criação é branco, centralizado, com overlay escuro, cabeçalho com ícone de upload, grid de formulário e área de upload com borda tracejada.

**Padrões de interação**

- Modal com `AnimatePresence`
- Busca textual e filtros por categoria/status
- Upload de PDF ou imagem convertido em base64
- Ação destrutiva com `window.confirm`
- Categoria nova pode ser criada diretamente dentro do fluxo do modal

**Estados**

- Loading: spinner central
- Vazio filtrado: `EmptyState` com CTA para adicionar documento
- Erro de upload ou validação: toast
- Autorização negada: redirecionamento pelo `RouteGuard`

### Colaboradores

**Objetivo da tela**

Exibir colaboradores por posto, situação funcional e link para a ficha individual.

**Estrutura de layout**

A tela é mais enxuta que ANP e INMETRO. Há um cabeçalho simples com título e botão `Novo colaborador`. Depois vem um pequeno card de filtro por posto e, abaixo, uma tabela branca com cabeçalho em `bg-zinc-50`.

**Componentes visuais**

A tabela lista colaborador, posto, cargo, progresso, situação e ação. O colaborador aparece com foto circular ou avatar laranja com iniciais. O progresso hoje está representado por uma `ProgressBar` fixa em 100%. A situação usa `BadgeStatus` em verde, amarelo ou vermelho.

O modal de criação é mais simples: `max-w-xl`, `rounded-2xl`, sombra sutil, campos em grid e área de upload de foto com borda tracejada.

**Padrões de interação**

- Modal com fade + scale
- Upload de foto com preview imediato
- Formulário com `react-hook-form` + Zod
- Link textual laranja para “Ver ficha”

**Estados**

- Loading: spinner central
- Não há `EmptyState` implementado; se a lista vier vazia, a tabela aparece sem linhas
- Erros de validação ficam inline em vermelho
- Erro de upload usa toast

### Treinamentos

**Objetivo da tela**

Apresentar os cursos disponíveis, sua obrigatoriedade, carga horária e status do treinamento do usuário.

**Estrutura de layout**

O topo é um cabeçalho simples com título e subtítulo. O conteúdo é uma grade de cards, duas colunas em `lg`. Cada card funciona como uma vitrine do curso.

**Componentes visuais**

Cada curso usa `CardBase` com bloco superior de marca (`FREE SAFE` + ícone), nome do curso, descrição, badges de carga horária, conteúdos, questões e status, e um rodapé cinza-claro com CTA laranja para acessar o curso. O resultado é limpo e muito legível, sem excesso de densidade.

**Padrões de interação**

- Hover vertical leve nos cards
- CTA primário laranja no rodapé de cada card
- Sem modais ou filtros nesta tela

**Estados**

- Loading: spinner central
- Vazio: `EmptyState` dentro de `CardBase`
- Erro: sem tratamento visual dedicado

### Usuários

**Objetivo da tela**

Gerenciar acessos operacionais da rede, perfis e vínculo de cada usuário com um posto.

**Estrutura de layout**

A página abre com um hero card e botão `Novo usuário`. Abaixo há um único `CardBase` grande com cabeçalho, filtro por posto, busca textual e lista de usuários. Não é tabela; é uma pilha de cards de usuário. O modal de criação/edição é centralizado e mais robusto, com `max-w-2xl`.

**Componentes visuais**

Cada usuário aparece em card branco com avatar de iniciais em fundo `orange-50`, nome, email, badges de perfil e status, metadados do posto e data de criação. As ações ficam na direita: `Editar` em outline e `Ativar/Desativar` com cor dinâmica.

Dentro do modal, o rodapé inclui um box laranja claro de “Controle administrativo” com ícone `Shield`, reforçando o contexto sensível da tela.

**Padrões de interação**

- Página visível apenas para `ADMIN`
- Busca por nome, email ou posto
- Filtro de posto
- Modal com criação e edição no mesmo componente
- Desativação com `window.confirm`
- Estado do botão muda conforme o usuário está ativo ou inativo

**Estados**

- Loading: spinner central
- Vazio: `EmptyState` com CTA
- Erro de validação: toast
- Não-admin autenticado: redirecionado para `/`

## 5. Padrões de UX recorrentes

### Formulários

- Inputs e selects são brancos, com borda `zinc-200`, raio `rounded-xl` e foco laranja
- Labels ficam acima, em `text-sm font-medium text-zinc-700`
- Erros ficam logo abaixo, em `text-xs text-red-600`
- Campos read-only usam `bg-zinc-100 text-zinc-500`
- Botões de submit seguem o padrão laranja:

```txt
inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98]
```

### Modais

- Overlay escuro com opacidade entre `40%` e `70%`
- Conteúdo branco centralizado, `rounded-2xl`, borda zinc e `shadow-xl`
- Cabeçalho com ícone em container `bg-orange-50`
- Fechar no canto direito com botão neutro
- Entrada com fade + `y` + `scale`

### Confirmações

- Exclusões e desativações usam `window.confirm`
- Não há componente visual próprio de confirmação no momento

### Toasts

- Biblioteca: `Sonner`
- `Toaster` global no layout com `richColors` e posição `top-right`
- Ícones customizados para sucesso, info, warning, erro e loading
- Erros de upload, validação procedural e falhas operacionais são majoritariamente enviados por toast

### Animações `framer-motion`

#### Entrada de página/bloco

- Padrão recorrente:
  - `initial={{ opacity: 0, y: 12 }}`
  - `animate={{ opacity: 1, y: 0 }}`
  - `transition={{ duration: 0.35, ease: 'easeOut' }}`

#### Stagger de listas

- Container:
  - `transition: { staggerChildren: 0.05 }`
- Item:
  - `hidden: { opacity: 0, y: 12 }`
  - `show: { opacity: 1, y: 0 }`

#### Hover de cards

- `whileHover={{ y: -2 }}`
- `transition={{ type: 'spring', stiffness: 300 }}`

#### Expand/collapse

- Usado no histórico do INMETRO
- Padrão:
  - `initial={{ height: 0, opacity: 0 }}`
  - `animate={{ height: 'auto', opacity: 1 }}`
  - `exit={{ height: 0, opacity: 0 }}`

#### Drawer mobile

- Overlay com fade
- Aside desliza do `x: -288` para `0`

#### Lightbox de imagem

- Overlay escuro em tela cheia
- Imagem cresce com `scale` suave

### Padrão de cores de status

- `emerald/green`: aprovado, dentro, ativo, completo, pronto para envio
- `amber/yellow`: atenção, vencendo, em andamento, preenchimento parcial
- `red`: reprovado, fora da tolerância, vencido, desligado
- `orange`: ativo de navegação, CTA primário, contexto da marca, contadores auxiliares
- `zinc`: neutro, pendente, informação de apoio, superfícies secundárias

## 6. Estrutura de navegação e permissões

### Regra geral

- O `DashboardLayout` exige autenticação
- Cada tela usa `RouteGuard` com `podeVer(perfil, recurso)`
- A sidebar já filtra os itens por permissão antes de renderizar
- Se o usuário estiver autenticado e não autorizado, a navegação redireciona para `/`

### Perfis existentes

- `ADMIN`
- `GERENTE`
- `ADMINISTRATIVO`
- `RH`
- `COLABORADOR`
- `MANUTENCAO`

### Mapa de telas por perfil

| Tela | Rota | Grupo de navegação | ADMIN | GERENTE | ADMINISTRATIVO | RH | COLABORADOR | MANUTENCAO |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | `/` | Principal | Sim | Sim | Sim | Não | Não | Não |
| ANP / RAQ | `/anp` | Operação | Sim | Sim | Não | Não | Não | Não |
| INMETRO | `/inmetro` | Operação | Sim | Sim | Não | Não | Não | Não |
| Configurar bombas | `/inmetro/configurar` | dentro do fluxo INMETRO | Sim | Sim | Não | Não | Não | Não |
| Manutenção | `/manutencao` | Operação | Sim | Não | Não | Não | Não | Não |
| Drenagem | `/drenagem` | Operação | Sim | Não | Não | Não | Não | Não |
| Colaboradores | `/colaboradores` | Pessoas | Sim | Sim | Sim | Não | Não | Não |
| Treinamentos | `/treinamentos` | Pessoas | Sim | Sim | Não | Não | Não | Não |
| Entrevistas | `/entrevistas` | Pessoas | Sim | Não | Não | Não | Não | Não |
| Postos | `/postos` | Conformidade | Sim | Sim | Sim | Não | Não | Não |
| Documentos | `/documentos` | Conformidade | Sim | Sim | Sim | Não | Não | Não |
| Auditorias | `/auditorias` | Conformidade | Sim | Não | Não | Não | Não | Não |
| Relatórios | `/relatorios` | Conformidade | Sim | Não | Não | Não | Não | Não |
| Usuários | `/usuarios` | Administração | Sim | Não | Não | Não | Não | Não |

### Observação importante sobre a matriz atual

Os perfis `RH`, `COLABORADOR` e `MANUTENCAO` existem na tipagem e na autenticação, mas hoje não possuem telas liberadas na matriz de permissões. O nome do perfil `MANUTENCAO` não significa acesso automático à tela de Manutenção; essa rota está liberada apenas para `ADMIN`.

## Resumo para recriação

1. Use base clara e neutra: fundo geral `zinc-100`, cards brancos, bordas `zinc-200`, textos em `zinc-950/900/700/500`.
2. Trate `orange-500` como cor de marca e de ação; reserve-a para CTA principal, ícones de destaque e estado ativo.
3. A sidebar deve ser escura (`zinc-950`), fixa, com 288px de largura e item ativo em laranja com glow suave.
4. Os blocos principais das páginas precisam parecer “cards editoriais”: `rounded-[28px]`, borda leve e sombra discreta.
5. Mantenha a tipografia em Geist, com `h1` em `24px`, tracking-tight, subtítulos pequenos e números com `tabular-nums`.
6. Inputs e selects devem ser brancos, `rounded-xl`, com foco laranja e ring translúcido; read-only fica em `zinc-100`.
7. Use `IconBadge` e contêineres de ícone com fundo tonal (`orange-50`, `emerald-50`, `zinc-100`) em vez de ícones soltos.
8. O sistema visual prefere listas de cards e painéis resumidos a tabelas densas; quando houver tabela, preserve cabeçalho `zinc-50` e hover suave.
9. Toda interação importante precisa de microfeedback: hover com elevação de 2px, click com scale leve, drawer/modal com fade e slide/scale.
10. Estados semânticos devem ser instantaneamente reconhecíveis: verde para aprovado/dentro, âmbar para atenção, vermelho para erro/fora, orange para marca e contexto operacional.
