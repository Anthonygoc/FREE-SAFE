# Documentação Técnica — FREE SAFE

Documentação técnica completa do sistema de compliance operacional da Rede Free.
Para uma visão introdutória e instruções de execução, veja o [`README.md`](./README.md).

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Stack técnica](#2-stack-técnica)
3. [Arquitetura](#3-arquitetura)
4. [Estrutura de pastas](#4-estrutura-de-pastas)
5. [Módulos e funcionalidades](#5-módulos-e-funcionalidades)
6. [Perfis e permissões](#6-perfis-e-permissões)
7. [Modelo de dados](#7-modelo-de-dados)
8. [Autenticação e segurança](#8-autenticação-e-segurança)
9. [Integrações externas](#9-integrações-externas)
10. [Variáveis de ambiente](#10-variáveis-de-ambiente)
11. [Deploy e operação](#11-deploy-e-operação)
12. [Histórico de versões](#12-histórico-de-versões)
13. [Pontos de atenção técnica](#13-pontos-de-atenção-técnica)

---

## 1. Visão geral

O FREE SAFE é uma aplicação web full-stack que centraliza o compliance operacional de 19 postos da Rede Free: qualidade de combustíveis, aferições INMETRO, documentos regulatórios, colaboradores, treinamentos, usuários, auditoria e notificações.

O problema que resolve é a fragmentação de controles em planilhas e documentos soltos, a falta de rastreabilidade e a baixa visibilidade consolidada por posto e por rede.

A aplicação é uma única app Next.js (App Router): React/TypeScript no frontend, API Routes no backend, Prisma sobre PostgreSQL, autenticação com NextAuth/Auth.js, React Query no client, geração de PDF/XLSX no servidor, e integrações com Supabase Storage e Resend.

---

## 2. Stack técnica

### Núcleo

- **next** 16.2.6 — framework full-stack (App Router)
- **react** / **react-dom** 19.2.4
- **typescript** 5
- **@prisma/client** / **prisma** 5.22.0 — ORM
- **next-auth** 5.0.0-beta.31 — autenticação

### Frontend

- **tailwindcss** 4 + **@tailwindcss/postcss** — estilização (CSS-first, sem `tailwind.config`)
- **shadcn** + **@base-ui/react** — componentes de UI
- **@tanstack/react-query** 5 — cache e fetch no client
- **react-hook-form** 7 + **@hookform/resolvers** + **zod** 4 — formulários e validação
- **framer-motion** 12 — animações
- **lucide-react** — ícones
- **sonner** — toasts
- **class-variance-authority**, **clsx**, **tailwind-merge** — composição de classes
- **next-themes** — temas

### Backend / dados

- **@supabase/supabase-js** 2.106 — cliente do Storage
- **resend** 6.16 — envio de e-mail
- **bcryptjs** 3 — hash de senha
- **@react-pdf/renderer** 4.5 — geração de PDF (RAQ, aferição, certificado)
- **exceljs** 4.4 — exportação XLSX
- **pg** 8 — driver PostgreSQL
- **dotenv** — variáveis de ambiente

### Infraestrutura

- **Banco:** PostgreSQL (compatível com Supabase via `DATABASE_URL`)
- **Storage:** Supabase Storage
- **E-mail:** Resend
- **Deploy:** Vercel (com cron em `vercel.json`)

---

## 3. Arquitetura

O projeto segue uma **arquitetura hexagonal** (ports & adapters), organizada em camadas:

- **domain** — entidades de negócio, erros de domínio, definição de permissões e *ports* (interfaces dos repositórios). É o núcleo, sem dependências externas.
- **application** — casos de uso (*use cases*), DTOs e helpers transversais de autorização, auditoria e upload. Orquestra o domínio.
- **infrastructure** — implementações concretas: repositórios Prisma, geração de PDF, envio de e-mail e Storage. São os *adapters* que satisfazem os *ports* do domínio.
- **interface** — a camada prática de entrega: páginas e API Routes (`src/app`), componentes (`src/components`), hooks (`src/hooks`) e utilitários (`src/lib`).

### Injeção de dependências

A composição fica em `src/lib/container.ts`, que funciona como um *service locator* baseado em funções (factory functions): cria os use cases sob demanda e reaproveita repositórios e adapters, usando o singleton do Prisma em `src/lib/prisma.ts`.

> **Nota de fidelidade:** a aplicação do padrão hexagonal é parcial. A maioria das rotas usa o container, mas algumas ainda instanciam `new UseCase(new Repository())` diretamente (ex.: rotas de postos e colaboradores). A autenticação (`src/lib/auth.ts`) também consulta o Prisma diretamente no `authorize`, fora do fluxo hexagonal. Isso é um débito conhecido, não um bug.

---

## 4. Estrutura de pastas

```
src/
├── app/              # páginas, layouts e API Routes
├── application/      # use-cases, DTOs e helpers (autorização, auditoria, upload)
├── components/       # layout, auth e UI
├── domain/           # entities, errors, permissions, ports
├── hooks/            # hooks de React Query
├── infrastructure/   # repositórios Prisma, PDF, e-mail, storage
├── lib/              # auth, prisma singleton, container, query client, api client
├── public/           # assets locais
├── tests/            # pasta existe (sem testes versionados ainda)
└── types/            # augmentations de tipos do NextAuth
```

---

## 5. Módulos e funcionalidades

| Módulo | O que faz | Acesso |
|--------|-----------|--------|
| **Dashboard** | KPIs reais (postos, colaboradores, conformidade média, pendências), ranking de conformidade e alertas críticos | ADMIN, GERENTE, ADMINISTRATIVO |
| **INMETRO** | Aferições individuais e em lote, histórico agrupado por `loteId`, filtro por bomba, exclusão individual/lote, export PDF/XLSX do lote, configuração de bombas/bicos | ADMIN, GERENTE |
| **ANP / RAQ** | Criação de RAQ com decisão automática APROVADO/REPROVADO, histórico por posto com filtros (data/produto/resultado), detalhe por ID, export PDF/XLSX | ADMIN, GERENTE |
| **Documentos** | Categorias, cadastro com arquivo, cálculo de status (VÁLIDO/VENCENDO/VENCIDO), listagem por posto, filtro de vencimento, exclusão | ADMIN, GERENTE, ADMINISTRATIVO |
| **Colaboradores** | Listagem paginada ou completa, filtros por cargo/status, detalhe, cadastro, edição, foto e anonimização LGPD | ADMIN, GERENTE, ADMINISTRATIVO |
| **Treinamentos** | Catálogo de cursos, conteúdos, questões, submissão de prova, resultado e certificado PDF | ADMIN, GERENTE (na matriz atual) |
| **Postos** | Listagem por escopo, detalhe, limites de usuários por posto, logo e tolerância INMETRO | Leitura: ADMIN, GERENTE, ADMINISTRATIVO; Edição: apenas ADMIN |
| **Usuários** | Listagem global/por posto, criação de GERENTE/ADMINISTRATIVO, edição de nome/e-mail/perfil/posto/senha, ativação/desativação | ADMIN |
| **Auditoria** | Trilha de ações com filtros por posto, usuário, recurso, ação e intervalo de datas | ADMIN |
| **Notificações** | Sino no header (polling a cada 60s) + e-mail automático de vencimento documental | Visão: ADMIN, GERENTE, ADMINISTRATIVO |
| **Perfil** | Self-service de nome, e-mail e troca de senha | Qualquer usuário autenticado |

### Tolerância INMETRO configurável

A situação de cada aferição (DENTRO ou FORA da tolerância) é calculada pela entidade de domínio com base em `Posto.toleranciaInmetroMl`. Cada posto define seu próprio limite (padrão: 100 mL, representando ±100). **Aferições antigas não são recalculadas** quando a tolerância muda — apenas as novas usam o valor atual, preservando o histórico.

---

## 6. Perfis e permissões

### Perfis no código

`ADMIN`, `GERENTE`, `ADMINISTRATIVO`, `RH`, `COLABORADOR`, `MANUTENCAO`.

Na matriz de permissões atual (`src/domain/permissions/permissions.ts`):

- **ADMIN** — todas as permissões
- **GERENTE** — inmetro, anp, bombas, documentos, colaboradores, cursos, dashboard, postos
- **ADMINISTRATIVO** — documentos, colaboradores, dashboard, postos
- **RH**, **COLABORADOR**, **MANUTENCAO** — sem permissões efetivas (perfis aposentados/reservados)

### Como a autorização funciona

- **Backend:** a função `autorizar(usuario, recurso, acao, postoIdAlvo?)` em `src/application/shared/authorize.ts` valida o par recurso/ação e, quando há `postoIdAlvo`, restringe GERENTE e ADMINISTRATIVO ao próprio posto.
- **Frontend:** o `RouteGuard` (`src/components/auth/route-guard.tsx`) checa a permissão de *ver* e redireciona o usuário autenticado sem acesso para `/`.
- **Middleware:** a sessão ausente é tratada antes, no `middleware.ts`, que redireciona para `/login`.

---

## 7. Modelo de dados

Entidades do `prisma/schema.prisma`:

| Model | Descrição |
|-------|-----------|
| **User** | Usuário autenticável: perfil, senha (hash), reset token, vínculo opcional com Posto |
| **AuditLog** | Trilha de auditoria de ações sobre recursos |
| **Posto** | Unidade da Rede Free; relaciona usuários, colaboradores, RAQs, aferições, bombas, documentos, manutenções e drenagens |
| **Bomba** | Bomba de um posto; possui vários Bico |
| **Bico** | Bico de uma bomba; tem produto e pode ter várias Afericao |
| **Colaborador** | Cadastro funcional vinculado a Posto e opcionalmente a User |
| **Curso** | Catálogo de treinamentos; tem conteúdos, questões, attempts e treinamentos por colaborador |
| **CursoConteudo** | Unidade de conteúdo de um curso |
| **CursoQuestao** | Questão de prova de um curso |
| **ProvaAttempt** | Tentativa de prova de um colaborador num curso |
| **ProvaResposta** | Resposta individual de uma questão dentro de uma tentativa |
| **TreinamentoColaborador** | Status consolidado do curso por colaborador |
| **Entrevista** | Registro de entrevista; relaciona Colaborador e User responsável |
| **RAQ** | Relatório de análise de combustível; relaciona Posto e User responsável |
| **Afericao** | Medição INMETRO; relaciona Posto e opcionalmente Bico, com suporte a `loteId` |
| **CategoriaDocumento** | Taxonomia dos documentos |
| **Documento** | Documento de um posto, ligado a uma categoria |
| **Manutencao** | Ordem/histórico de manutenção de um posto |
| **Drenagem** | Registro operacional de drenagem de um posto |

---

## 8. Autenticação e segurança

- **NextAuth/Auth.js v5** com provider Credentials, estratégia de sessão JWT, `maxAge` de **8 horas** e `updateAge` de **1 hora** (`src/lib/auth.ts`).
- O `authorize` valida e-mail/senha com Zod, busca o usuário no banco, exige `ativo = true` e compara o hash com `bcrypt.compare`.
- O JWT/sessão carregam `id`, `nome`, `email`, `perfil` e `postoId`.
- O **middleware** protege todas as rotas fora das públicas, validando o token com `getToken` (com `secureCookie` em HTTPS/produção). Token ausente, inválido ou expirado redireciona para `/login`.
- **Recuperação de senha:** `/api/auth/esqueci-senha` grava um `resetToken` com expiração de 1 hora; `/api/auth/redefinir-senha` troca a senha e limpa o token.
- **Troca de senha logado:** `/api/perfil/senha` exige a senha atual correta e nova senha com mínimo de 8 caracteres.
- **Hash:** bcryptjs.
- **Erros HTTP** são centralizados em `src/lib/handle-api-error.ts`, com mensagens amigáveis e tratamento de unicidade do Prisma (P2002) para CPF/e-mail/CNPJ duplicados.

---

## 9. Integrações externas

### Supabase

Usado como **Storage** via cliente server-side. O código gera URL pública e aceita upload em formato data URI (base64), convertendo para arquivo no bucket apropriado. Buckets públicos: `colaboradores`, `afericoes`, `documentos`, `postos`.

> A leitura lida com dois formatos: registros antigos podem ter o arquivo em base64 (não migrados); registros novos guardam a URL do Storage. Ambos renderizam normalmente.

### Resend

Envia os e-mails de **reset de senha** e **aviso de documentos vencendo/a vencer**. Requer um domínio verificado (DKIM/SPF/MX) para entregar a destinatários arbitrários; o remetente é definido em `EMAIL_FROM`.

### Vercel

Hospeda a aplicação, as API Routes e o middleware. Executa o **cron** `/api/cron/vencimentos` conforme o agendamento `0 11 * * *` (definido em `vercel.json`), protegido por autenticação `Bearer ${CRON_SECRET}`.

---

## 10. Variáveis de ambiente

Lidas pelo código (defina-as no `.env` local e na Vercel; **nunca** versione valores):

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Conexão PostgreSQL/Supabase |
| `NEXTAUTH_SECRET` | Assinatura do JWT |
| `NEXTAUTH_URL` | URL pública da aplicação |
| `APP_URL` | URL usada nos links dos e-mails |
| `NODE_ENV` | Ambiente (dev/produção) |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | Chave secreta (service role) para upload no Storage |
| `RESEND_API_KEY` | Chave da API do Resend |
| `EMAIL_FROM` | Remetente dos e-mails |
| `CRON_SECRET` | Protege a rota do cron de vencimentos |

> **Discrepância conhecida:** o `.env.example` ainda cita `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`, mas o código atual lê `SUPABASE_SERVICE_KEY`. Vale atualizar o `.env.example`.

---

## 11. Deploy e operação

- **Alvo:** Vercel. O build executa `prisma generate && next build`.
- **Migrations:** não rodam automaticamente no deploy. Aplique manualmente com `npx prisma migrate deploy` antes de subir mudanças de schema.
- **Cron de vencimentos:** configurado em `vercel.json`, chama `GET /api/cron/vencimentos` diariamente. O use case busca documentos vencendo em até 30 dias, agrupa por posto, filtra usuários ativos ADMIN/GERENTE e envia um e-mail por posto.
- **Storage e e-mail:** dependem das variáveis acima. Sem elas, o código falha de forma tolerante (upload/e-mail não quebram o fluxo), mas a funcionalidade fica parcial.

### Seeds disponíveis

O `npm run seed` popula: postos, categorias de documento, bombas/bicos, cursos (incluindo NR01, NR35, benzeno) e usuário admin.

---

## 12. Histórico de versões

### Base 1.0

Login/sessão, dashboard, postos, colaboradores, RAQ/ANP, INMETRO, documentos, usuários, perfil, cursos/provas/certificados e navegação administrativa. Inclui a trilha de auditoria, recuperação de senha, notificações de vencimento (cron + sino), paginação, índices de performance e a base de LGPD (anonimização, política de privacidade).

### Evolução 1.1

- Correção da expiração de sessão (8h) e validação real do token no middleware
- Migração de uploads de base64 para **Supabase Storage** (colaborador, aferição, documento, logo de posto)
- Histórico INMETRO agrupado por `loteId` + paginação por lote
- Validação de formulários refinada + tratamento amigável de duplicidade (CPF/e-mail)
- **Logo do posto** e **tolerância INMETRO configurável** por posto
- Limites informativos `maxGerentes` / `maxAdministrativos`
- Troca de senha do usuário logado (no perfil)
- **Domínio próprio** com e-mail verificado no Resend

> **Inconsistência de versionamento:** o `package.json` está em `0.1.0`, enquanto `src/lib/version.ts` expõe `APP_VERSION = '1.0.0'`. Vale alinhar os dois.

---

## 13. Pontos de atenção técnica

Itens conhecidos, úteis para manutenção futura:

- **Versão desalinhada:** `package.json` (0.1.0) vs `version.ts` (1.0.0).
- **`.env.example` desatualizado:** cita variáveis Supabase com nomes antigos.
- **DI parcial:** algumas rotas instanciam use cases diretamente em vez de usar o container.
- **Auth fora do hexágono:** `auth.ts` consulta o Prisma diretamente.
- **Perfil sem RouteGuard:** `/perfil` depende só da sessão (qualquer autenticado acessa, o que é intencional).
- **Sem testes versionados:** `src/tests/` existe mas está vazio; não há script de `test` no `package.json`. Candidato natural para a próxima fase (testes de permissão).
- **Migrations manuais no deploy:** considerar automatizar `migrate deploy` no pipeline futuro.
- **Entrevista sem relation de Posto:** o model tem `postoId` mas não declara a relation Prisma com Posto.
