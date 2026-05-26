# FREE SAFE

![Status](https://img.shields.io/badge/status-production-orange)
![Next.js](https://img.shields.io/badge/next.js-16.2.6-black)
![Prisma](https://img.shields.io/badge/prisma-5.22.0-2D3748)
![TypeScript](https://img.shields.io/badge/typescript-5.x-3178C6)

## 🛡️ FREE SAFE — Plataforma de Treinamento, Qualidade e Conformidade

O **FREE SAFE** é uma plataforma web para gestão operacional da **Rede Free**, focada em **treinamento, qualidade, conformidade regulatória e acompanhamento de rotinas críticas** em postos de combustíveis.

O sistema centraliza indicadores, pessoas, documentos, análises de combustíveis e aferições metrológicas em uma única aplicação, reduzindo controles paralelos, melhorando rastreabilidade e apoiando decisões operacionais com dados reais.

### Para quem é

- Gestores da Rede Free
- Gerentes de posto
- RH e áreas de treinamento
- Times de manutenção e conformidade
- Operação responsável por ANP, INMETRO/IPEM e documentação regulatória

### Qual problema resolve

- Fragmentação de controles em planilhas e documentos soltos
- Falta de visão consolidada dos postos e seus indicadores
- Dificuldade para acompanhar treinamentos, admissões e status de colaboradores
- Baixa rastreabilidade em análises de qualidade e aferições
- Risco de perda de prazo documental e falhas de conformidade

## 🖼️ Principais telas

> O repositório ainda não versiona screenshots reais em `public/` ou `docs/`. Abaixo está a descrição visual das telas implementadas no MVP atual.

| Tela | Descrição visual |
| --- | --- |
| Login | Tela dividida em duas colunas, com branding escuro em gradiente, identidade laranja da FREE SAFE e formulário de autenticação com `next-auth`. |
| Dashboard | Cards de KPI, ranking de conformidade por posto, alertas críticos e layout administrativo com sidebar fixa. |
| Postos | Grade de cards com busca por nome, indicador de risco, conformidade e status resumido por unidade. |
| Colaboradores | Tabela por posto com filtro, modal de cadastro com `react-hook-form` + Zod e feedback visual de progresso/situação. |
| ANP / RAQ | Formulário operacional para análise de combustível, prévia de aprovação em tempo real, histórico por posto e emissão de PDF. |
| INMETRO | Formulário de aferição de bombas com cálculo automático de tolerância e histórico das medições. |
| Documentos | Painel por posto com alerta de vencimento, cards de status documental e leitura de vigência. |
| Demais módulos | Treinamentos, entrevistas, manutenção, drenagem, auditorias e relatórios já possuem páginas e navegação, mas parte da integração ainda está em evolução. |

## 🧰 Stack tecnológica

| Camada | Tecnologia | Versão |
| --- | --- | --- |
| Framework full-stack | Next.js | `16.2.6` |
| UI | React | `19.2.4` |
| Runtime client/server | React DOM | `19.2.4` |
| Linguagem | TypeScript | `5.x` |
| Autenticação | NextAuth/Auth.js | `5.0.0-beta.31` |
| ORM | Prisma | `5.22.0` |
| Client ORM | `@prisma/client` | `5.22.0` |
| Banco de dados | PostgreSQL | compatível via Prisma/Supabase |
| Data fetching | TanStack React Query | `5.100.14` |
| Formulários | React Hook Form | `7.76.1` |
| Validação | Zod | `4.4.3` |
| UI feedback | Sonner | `2.0.7` |
| PDF | `@react-pdf/renderer` | `4.5.1` |
| Estilização | Tailwind CSS | `4.x` |
| Animações | Framer Motion | `12.40.0` |
| Ícones | Lucide React | `1.16.0` |
| Supabase SDK | `@supabase/supabase-js` | `2.106.1` |
| Hash de senha | bcryptjs | `3.0.3` |
| E-mail | Resend | `6.12.3` |
| Qualidade | ESLint | `9.x` |
| Testes instalados | Vitest + Supertest | `4.1.7` / `7.2.2` |

### Ambiente recomendado

| Item | Versão recomendada |
| --- | --- |
| Node.js | `20+` |
| npm | `10+` |

## 🏗️ Arquitetura

O projeto segue uma **arquitetura hexagonal**, separando regras de negócio, casos de uso, infraestrutura e interface.

### Camadas

| Camada | Responsabilidade |
| --- | --- |
| `domain/` | Entidades, regras centrais, erros e contratos de portas. Não depende de framework. |
| `application/` | Casos de uso e DTOs. Orquestra regras do domínio e autorização de negócio. |
| `infrastructure/` | Implementações concretas de persistência, mapeadores Prisma e adapter de PDF. |
| `interface` / `app` / `components` / `hooks` | Telas Next.js, rotas HTTP, componentes React, hooks React Query e integração com UX. |

### Fluxo resumido

1. A interface chama um hook (`useQuery` / `useMutation`).
2. O hook consome uma rota em `src/app/api`.
3. A rota autentica o usuário com `auth()`.
4. A rota instancia um use case da camada `application`.
5. O use case consulta portas implementadas em `infrastructure`.
6. A resposta volta padronizada como `{ data: ... }`, exceto endpoints especiais como PDF e health-check.

### Estrutura de pastas

```text
src/
├── app/
│   ├── (auth)/login
│   ├── (dashboard)/
│   │   ├── anp
│   │   ├── auditorias
│   │   ├── colaboradores
│   │   ├── documentos
│   │   ├── drenagem
│   │   ├── entrevistas
│   │   ├── inmetro
│   │   ├── manutencao
│   │   ├── postos
│   │   ├── relatorios
│   │   └── treinamentos
│   └── api/
│       ├── afericao
│       ├── auth
│       ├── colaboradores
│       ├── dashboard
│       ├── documentos
│       ├── health
│       ├── postos
│       └── raq
├── application/
│   ├── dtos
│   └── use-cases
├── components/
│   ├── dashboard
│   ├── layout
│   └── ui
├── domain/
│   ├── entities
│   ├── errors
│   └── ports
├── hooks
├── infrastructure/
│   ├── database/prisma/repositories
│   └── pdf
├── lib
└── types
```

## 🚀 Funcionalidades do MVP

### Implementadas com integração real

- **Autenticação com perfis** via NextAuth v5 com strategy JWT e provider de credenciais.
- **Dashboard com KPIs reais** consumindo `/api/dashboard/kpis`.
- **Módulo de Postos** com listagem real por perfil.
- **Módulo de Colaboradores** com listagem e cadastro via API.
- **Módulo ANP / RAQ** com regras automáticas de aprovação/reprovação, histórico por posto e **geração de PDF**.
- **Módulo INMETRO / Aferição** com cálculo de tolerância e histórico.
- **Módulo de Documentos** com leitura por posto e alerta de vencimento.

### Implementadas parcialmente no MVP atual

- **Treinamentos**: página e UX prontas, mas ainda com dados mockados no front.
- **Entrevistas**: catálogo visual dos tipos de entrevista, sem API publicada no momento.
- **Manutenção**: página institucional do módulo, sem CRUD/API expostos.
- **Drenagem**: página institucional do módulo, sem CRUD/API expostos.
- **Auditorias**: página institucional do módulo, sem CRUD/API expostos.
- **Relatórios**: página institucional do módulo, sem exportações integradas além do PDF de RAQ.

## 🔌 Rotas de API

### Convenções

- Base local: `http://localhost:3000/api`
- Auth: sessão JWT gerida por NextAuth/Auth.js
- Resposta padrão: `{ "data": ... }`
- Erros de validação: `400` ou `422` conforme o endpoint

### Autenticação e utilitários

| Método | Path | Autenticação | Input | Output |
| --- | --- | --- | --- | --- |
| `GET` | `/api/health` | Pública | Sem input | `{ ok, userCount, adminExists, adminAtivo }` |
| `GET` / `POST` | `/api/auth/[...nextauth]` | Pública | Handlers internos do Auth.js | Fluxos de sessão, callback e credenciais |

### Dashboard

| Método | Path | Autenticação | Input | Output |
| --- | --- | --- | --- | --- |
| `GET` | `/api/dashboard/kpis` | Obrigatória. Perfis permitidos: `ADMIN`, `GERENTE` | Sem query params | `{ totalPostos, totalColaboradores, mediaConformidade, totalPendencias, alertas[] }` |

### Postos

| Método | Path | Autenticação | Input | Output |
| --- | --- | --- | --- | --- |
| `GET` | `/api/postos` | Obrigatória. Perfis permitidos: `ADMIN`, `GERENTE` | Sem query params | `Posto[]` com `{ id, nome, cidade, uf, conformidade }` |

### Colaboradores

| Método | Path | Autenticação | Input | Output |
| --- | --- | --- | --- | --- |
| `GET` | `/api/colaboradores` | Obrigatória. Perfis permitidos: `ADMIN`, `GERENTE` | Query: `postoId` obrigatório, `cargo?`, `status?` (`ATIVO`, `AFASTADO`, `DESLIGADO`) | `Colaborador[]` |
| `POST` | `/api/colaboradores` | Obrigatória. Perfis permitidos: `ADMIN`, `GERENTE` | Body: `postoId`, `userId?`, `nome`, `cpf`, `cargo`, `dataAdmissao`, `status?`, `turno?`, `escala?`, `telefone?`, `email?`, `endereco?` | `{ id }` |

### ANP / RAQ

| Método | Path | Autenticação | Input | Output |
| --- | --- | --- | --- | --- |
| `GET` | `/api/raq` | Obrigatória. Perfis permitidos: `ADMIN`, `GERENTE` | Query: `postoId` obrigatório, `produto?`, `resultado?`, `dataInicio?`, `dataFim?` | `RAQ[]` |
| `POST` | `/api/raq` | Obrigatória. Perfis permitidos: `ADMIN`, `GERENTE` | Body: `postoId`, `produto`, `temperaturaObservada`, `densidadeObservada`, `aspecto`, `cor`, `faseAquosa?`, `teorAlcoolico?`, `distribuidora?`, `notaFiscal?`, `placaCaminhao?`, `tanqueDestino?` | `{ raqId, aprovado, resultado }` |
| `GET` | `/api/raq/:id` | Obrigatória. Qualquer usuário autenticado no código atual | Param: `id` UUID | RAQ completo |
| `GET` | `/api/raq/:id/pdf` | Obrigatória. Perfis permitidos: `ADMIN`, `GERENTE` | Param: `id` UUID | Binário `application/pdf` |

### INMETRO / Aferição

| Método | Path | Autenticação | Input | Output |
| --- | --- | --- | --- | --- |
| `GET` | `/api/afericao` | Obrigatória. Perfis permitidos: `ADMIN`, `GERENTE` | Query: `postoId` obrigatório, `bomba?` | `Afericao[]` |
| `POST` | `/api/afericao` | Obrigatória. Perfis permitidos: `ADMIN`, `GERENTE` | Body: `postoId`, `produto`, `bomba`, `bico`, `resultadoMl`, `observacoes?`, `medidaPadrao?` | `{ afericaoId, situacao, dentro }` |
| `GET` | `/api/afericao/:id` | Obrigatória. Perfis permitidos: `ADMIN`, `GERENTE` | Param: `id` UUID | Aferição completa |

### Documentos

| Método | Path | Autenticação | Input | Output |
| --- | --- | --- | --- | --- |
| `GET` | `/api/documentos` | Obrigatória. Perfis permitidos: `ADMIN`, `GERENTE` | Query: `postoId` obrigatório, `vencendo?` em dias | `Documento[]` |

## 🗄️ Banco de dados

O schema Prisma atual define **11 tabelas principais**.

### Tabelas

| Tabela | Descrição |
| --- | --- |
| `users` | Usuários autenticáveis da plataforma, com perfil, senha hash, vínculo opcional a posto e status ativo. |
| `postos` | Cadastro das unidades da Rede Free. |
| `colaboradores` | Cadastro funcional de pessoas vinculadas a um posto. |
| `cursos` | Catálogo de cursos e treinamentos obrigatórios ou opcionais. |
| `treinamentos_colaborador` | Relação entre colaborador e curso, com status, nota e certificado. |
| `entrevistas` | Registros de entrevistas operacionais e de RH. |
| `raqs` | Relatórios de análise de qualidade de combustíveis. |
| `afericoes` | Registros de aferição de bombas e bicos. |
| `documentos` | Controle de documentos regulatórios e operacionais por posto. |
| `manutencoes` | Ordens e históricos de manutenção preventiva/corretiva/emergencial. |
| `drenagens` | Controle operacional e ambiental de drenagens. |

### Enums

| Enum | Valores |
| --- | --- |
| `PerfilUsuario` | `ADMIN`, `GERENTE`, `RH`, `COLABORADOR`, `MANUTENCAO` |
| `StatusColaborador` | `ATIVO`, `AFASTADO`, `DESLIGADO` |
| `ProdutoCombustivel` | `GASOLINA_COMUM`, `GASOLINA_ADITIVADA`, `GASOLINA_PREMIUM`, `ETANOL_HIDRATADO`, `DIESEL_S10`, `DIESEL_S500` |
| `ResultadoAnalise` | `APROVADO`, `REPROVADO` |
| `AspectoCombustivel` | `LIQUIDO_E_ISENTO`, `TURVO`, `COM_IMPUREZAS` |
| `SituacaoAfericao` | `DENTRO_DA_LEGISLACAO`, `FORA_DA_TOLERANCIA` |
| `TipoEntrevista` | `ADMISSAO`, `INTEGRACAO`, `TRINTA_DIAS`, `EXPERIENCIA`, `PERIODICA`, `OCORRENCIA`, `RETORNO`, `DESLIGAMENTO` |
| `TipoDocumento` | `AUTORIZACAO_ANP`, `CONTRATO_DISTRIBUIDORA`, `ALVARA_FUNCIONAMENTO`, `ALVARA_SANITARIO`, `LICENCA_AMBIENTAL`, `AVCB_BOMBEIROS`, `INMETRO_IPEM`, `CNPJ`, `INSCRICAO_ESTADUAL`, `FISPQ`, `PARECER_TECNICO`, `OUTORGA`, `PLANTA_BAIXA`, `FOTO_FACHADA` |
| `StatusDocumento` | `VALIDO`, `VENCENDO`, `VENCIDO` |
| `TipoManutencao` | `PREVENTIVA`, `CORRETIVA`, `EMERGENCIAL` |
| `StatusManutencao` | `ABERTA`, `EM_ANDAMENTO`, `CONCLUIDA`, `CANCELADA` |

## 🔐 Autenticação e perfis de acesso

### Como funciona

- O projeto usa **NextAuth v5** com provider de **credenciais**.
- O login recebe `email` e `password`, valida com Zod e compara a senha com `bcryptjs`.
- A sessão usa **strategy `jwt`**.
- O token armazena `id`, `nome`, `email`, `perfil` e `postoId`.
- O `middleware.ts` protege todas as rotas privadas, exceto `/login`, `/api/auth`, `/api/health`, `/_next` e `/favicon`.

### Perfis existentes

| Perfil | Papel esperado |
| --- | --- |
| `ADMIN` | Acesso administrativo global à rede. |
| `GERENTE` | Acesso restrito ao posto vinculado. |
| `RH` | Perfil previsto para rotinas de pessoas e treinamento. |
| `COLABORADOR` | Perfil previsto para consumo operacional restrito. |
| `MANUTENCAO` | Perfil previsto para processos técnicos de manutenção. |

### Regras atuais de autorização

| Recurso | `ADMIN` | `GERENTE` | `RH` | `COLABORADOR` | `MANUTENCAO` |
| --- | --- | --- | --- | --- | --- |
| Dashboard KPI | Sim | Sim, apenas do próprio posto | Não | Não | Não |
| Listar postos | Sim | Sim, apenas posto vinculado | Não | Não | Não |
| Listar/cadastrar colaboradores | Sim | Sim, apenas próprio posto | Não no código atual | Não | Não |
| Criar/listar RAQ | Sim | Sim, apenas próprio posto | Não | Não | Não |
| Emitir PDF RAQ | Sim | Sim, apenas próprio posto | Não | Não | Não |
| Criar/listar aferição | Sim | Sim, apenas próprio posto | Não | Não | Não |
| Listar documentos | Sim | Sim, apenas próprio posto | Não | Não | Não |
| Buscar RAQ por ID | Sim | Sim | Sim, se autenticado | Sim, se autenticado | Sim, se autenticado |

> Observação importante: embora os perfis `RH`, `COLABORADOR` e `MANUTENCAO` já existam no schema e no JWT, os use cases implementados hoje concentram autorização de negócio em `ADMIN` e `GERENTE`.

## 🧪 Como rodar localmente

### Pré-requisitos

- Node.js `20+`
- npm `10+`
- PostgreSQL disponível localmente ou via container

### Variáveis de ambiente

Use o arquivo `.env.example` como base:

```bash
cp .env.example .env
```

Conteúdo esperado:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/free_safe?schema=public"
NEXTAUTH_SECRET="troque-por-um-segredo-longo-e-aleatorio"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### Instalação e setup

```bash
npm install
```

```bash
npx prisma migrate dev
```

```bash
npm run seed
```

```bash
npm run dev
```

Aplicação local:

```text
http://localhost:3000
```

## ☁️ Deploy

### Vercel

Indicado para hospedar:

- Frontend Next.js
- API Routes do App Router
- Middleware de autenticação

### Supabase

Indicado para hospedar:

- Banco PostgreSQL usado pelo Prisma
- Storage de arquivos e evidências, quando a integração for concluída

### Variáveis de ambiente em produção

| Variável | Obrigatória | Finalidade |
| --- | --- | --- |
| `DATABASE_URL` | Sim | Conexão Prisma com PostgreSQL/Supabase |
| `NEXTAUTH_SECRET` | Sim | Assinatura do JWT/sessão |
| `NEXTAUTH_URL` | Sim | URL pública da aplicação |
| `NODE_ENV` | Sim | Deve ser `production` em ambiente produtivo |
| `SUPABASE_URL` | Opcional no código atual | Preparação para storage/serviços Supabase |
| `SUPABASE_ANON_KEY` | Opcional no código atual | Cliente público Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Opcional no código atual | Operações server-side no storage |

## 🛣️ Roadmap

### Fase 2

- Integrar o módulo de treinamentos com dados reais de `cursos` e `treinamentos_colaborador`
- Expor APIs para entrevistas
- Implementar CRUD real de documentos
- Criar vínculo operacional de gerente com posto via interface administrativa

### Fase 3

- Implementar módulos de manutenção, drenagem, auditorias e relatórios com persistência real
- Subir armazenamento de arquivos no Supabase Storage
- Adicionar upload de boletins, fotos e anexos regulatórios
- Criar filtros avançados, exportações e relatórios gerenciais

### Fase 4

- Fortalecer RBAC para `RH`, `COLABORADOR` e `MANUTENCAO`
- Cobertura de testes automatizados com Vitest e Supertest
- Observabilidade, trilha de auditoria e métricas operacionais
- Workflows automatizados de vencimento documental e reciclagem de treinamentos

## 🔑 Credenciais de teste

As seeds atuais criam um usuário administrativo local:

| Campo | Valor |
| --- | --- |
| E-mail | `admin@freesafe.com.br` |
| Senha | `freesafe@2024` |
| Perfil | `ADMIN` |

> Use apenas para ambiente local/de desenvolvimento.

## 📌 Observações técnicas

- O projeto já possui dependências de teste (`vitest`, `supertest`), mas **não há testes versionados em `src/tests/` neste momento**.
- O layout principal usa `SessionProvider` + `QueryClientProvider`.
- O feedback de mutações utiliza **Sonner**.
- O PDF de RAQ é gerado server-side com `@react-pdf/renderer`.

## 📄 Licença e autoria

**Rede Free**  
Desenvolvido por **Anthony Gabriel**
