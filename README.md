# FREE SAFE

Plataforma de compliance operacional da **Rede Free** — gestão centralizada de qualidade de combustíveis, aferições INMETRO, documentos regulatórios, colaboradores e treinamentos para uma rede de 19 postos no Mato Grosso.

> Substitui o controle fragmentado em planilhas e documentos soltos por um sistema único, rastreável e com visibilidade consolidada por posto e por rede.

---

## Visão geral

O FREE SAFE concentra, num só lugar, os controles que antes viviam espalhados:

- **INMETRO** — aferições de bombas/bicos (individual e em lote), com tolerância configurável por posto e histórico agrupado por lote
- **ANP / RAQ** — relatórios de análise de qualidade de combustível com aprovação automática
- **Documentos** — controle de vencimento (válido / vencendo / vencido) com notificação automática
- **Colaboradores** — cadastro funcional, treinamentos e anonimização LGPD
- **Treinamentos** — cursos, provas e certificados
- **Auditoria** — trilha completa de quem fez o quê
- **Notificações** — avisos de vencimento por e-mail e sino no sistema

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Linguagem | TypeScript |
| Autenticação | NextAuth / Auth.js v5 (JWT, Credentials) |
| Banco | PostgreSQL (Supabase) via Prisma 5 |
| Storage | Supabase Storage |
| E-mail | Resend |
| UI | Tailwind CSS 4, shadcn/ui, framer-motion, lucide-react |
| Estado/dados | TanStack React Query |
| Formulários | react-hook-form + Zod |
| Documentos | @react-pdf/renderer (PDF), exceljs (XLSX) |
| Deploy | Vercel |

A arquitetura segue o padrão **hexagonal**: `domain` → `application` → `infrastructure` → `interface`. Detalhes em [`DOCUMENTACAO.md`](./DOCUMENTACAO.md).

---

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- npm 10+
- PostgreSQL acessível (ou um projeto Supabase)
- Arquivo `.env` configurado (veja a seção abaixo)

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Aplicar as migrations no banco
npx prisma migrate dev

# 3. Popular dados iniciais (postos, categorias, cursos, admin, etc.)
npm run seed

# 4. Subir o servidor de desenvolvimento
npm run dev
```

O sistema sobe em `http://localhost:3000`.

> **Dica de rede:** migrations contra o Supabase pelo host direto podem falhar com erro `P1001` em redes Wi-Fi (resolução IPv6). Se acontecer, use uma conexão cabeada.

### Scripts disponíveis

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | `prisma generate` + build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |
| `npm run seed` | Popula o banco com dados iniciais |

---

## Variáveis de ambiente

O sistema lê as seguintes variáveis (defina-as no `.env` local e no painel da Vercel em produção). **Nunca** versione os valores reais.

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão do PostgreSQL/Supabase |
| `NEXTAUTH_SECRET` | Segredo de assinatura do JWT |
| `NEXTAUTH_URL` | URL pública da aplicação |
| `APP_URL` | URL pública usada nos links dos e-mails |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | Chave secreta (service role) do Supabase, para upload no Storage |
| `RESEND_API_KEY` | Chave da API do Resend |
| `EMAIL_FROM` | Remetente dos e-mails (ex.: `FREE SAFE <nao-responda@seu-dominio>`) |
| `CRON_SECRET` | Segredo que protege a rota do cron de vencimentos |

> Os arquivos no Supabase Storage usam os buckets **públicos**: `colaboradores`, `afericoes`, `documentos`, `postos`. Crie-os no painel do Supabase antes de usar os uploads.

---

## Deploy

O deploy é feito na **Vercel**. O build executa `prisma generate && next build` automaticamente.

- As **migrations** não rodam sozinhas no deploy — aplique-as com `npx prisma migrate deploy` (ou `migrate dev` em desenvolvimento) antes de subir mudanças de schema.
- O **cron de vencimentos** está em `vercel.json` e chama `GET /api/cron/vencimentos` diariamente (protegido por `CRON_SECRET`), enviando os avisos de documentos a vencer.

---

## Perfis de acesso

| Perfil | Acesso |
|--------|--------|
| **ADMIN** | Tudo, incluindo usuários, auditoria e todos os postos |
| **GERENTE** | Módulos técnicos (INMETRO, ANP, bombas), documentos, colaboradores e cursos do próprio posto |
| **ADMINISTRATIVO** | Documentos e colaboradores do próprio posto |
| **COLABORADOR** | Não faz login (cadastro funcional apenas) |

---

## Licença e propriedade

Sistema proprietário desenvolvido para a Rede Free. Documentação técnica completa em [`DOCUMENTACAO.md`](./DOCUMENTACAO.md).
