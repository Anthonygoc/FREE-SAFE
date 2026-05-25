-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMIN', 'GERENTE', 'RH', 'COLABORADOR', 'MANUTENCAO');

-- CreateEnum
CREATE TYPE "StatusColaborador" AS ENUM ('ATIVO', 'AFASTADO', 'DESLIGADO');

-- CreateEnum
CREATE TYPE "ProdutoCombustivel" AS ENUM ('GASOLINA_COMUM', 'GASOLINA_ADITIVADA', 'GASOLINA_PREMIUM', 'ETANOL_HIDRATADO', 'DIESEL_S10', 'DIESEL_S500');

-- CreateEnum
CREATE TYPE "ResultadoAnalise" AS ENUM ('APROVADO', 'REPROVADO');

-- CreateEnum
CREATE TYPE "AspectoCombustivel" AS ENUM ('LIQUIDO_E_ISENTO', 'TURVO', 'COM_IMPUREZAS');

-- CreateEnum
CREATE TYPE "SituacaoAfericao" AS ENUM ('DENTRO_DA_LEGISLACAO', 'FORA_DA_TOLERANCIA');

-- CreateEnum
CREATE TYPE "TipoEntrevista" AS ENUM ('ADMISSAO', 'INTEGRACAO', 'TRINTA_DIAS', 'EXPERIENCIA', 'PERIODICA', 'OCORRENCIA', 'RETORNO', 'DESLIGAMENTO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('AUTORIZACAO_ANP', 'CONTRATO_DISTRIBUIDORA', 'ALVARA_FUNCIONAMENTO', 'ALVARA_SANITARIO', 'LICENCA_AMBIENTAL', 'AVCB_BOMBEIROS', 'INMETRO_IPEM', 'CNPJ', 'INSCRICAO_ESTADUAL', 'FISPQ', 'PARECER_TECNICO', 'OUTORGA', 'PLANTA_BAIXA', 'FOTO_FACHADA');

-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM ('VALIDO', 'VENCENDO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "TipoManutencao" AS ENUM ('PREVENTIVA', 'CORRETIVA', 'EMERGENCIAL');

-- CreateEnum
CREATE TYPE "StatusManutencao" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL DEFAULT 'COLABORADOR',
    "posto_id" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postos" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "razao_social" VARCHAR(200) NOT NULL,
    "cnpj" VARCHAR(18) NOT NULL,
    "inscricao_estadual" VARCHAR(30),
    "endereco" VARCHAR(300) NOT NULL,
    "cidade" VARCHAR(100) NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "gerente_id" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colaboradores" (
    "id" TEXT NOT NULL,
    "posto_id" TEXT NOT NULL,
    "user_id" TEXT,
    "nome" VARCHAR(150) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "rg" VARCHAR(20),
    "telefone" VARCHAR(20),
    "email" VARCHAR(200),
    "endereco" VARCHAR(300),
    "cargo" VARCHAR(80) NOT NULL,
    "data_admissao" DATE NOT NULL,
    "turno" VARCHAR(30),
    "escala" VARCHAR(30),
    "status" "StatusColaborador" NOT NULL DEFAULT 'ATIVO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "carga_horaria" INTEGER,
    "validade_dias" INTEGER,
    "cargos_obrigatorios" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treinamentos_colaborador" (
    "id" TEXT NOT NULL,
    "colaborador_id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "nota" DOUBLE PRECISION,
    "data_conclusao" DATE,
    "certificado_url" VARCHAR(500),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treinamentos_colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrevistas" (
    "id" TEXT NOT NULL,
    "colaborador_id" TEXT NOT NULL,
    "posto_id" TEXT NOT NULL,
    "responsavel_id" TEXT NOT NULL,
    "tipo" "TipoEntrevista" NOT NULL,
    "data" DATE NOT NULL,
    "respostas" JSONB,
    "observacoes" TEXT,
    "compromisso_colaborador" TEXT,
    "assinatura_colaborador_url" VARCHAR(500),
    "assinatura_responsavel_url" VARCHAR(500),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entrevistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raqs" (
    "id" TEXT NOT NULL,
    "posto_id" TEXT NOT NULL,
    "responsavel_id" TEXT NOT NULL,
    "produto" "ProdutoCombustivel" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperatura_observada" DOUBLE PRECISION NOT NULL,
    "densidade_observada" DOUBLE PRECISION NOT NULL,
    "massa_20c" DOUBLE PRECISION,
    "aspecto" "AspectoCombustivel" NOT NULL,
    "cor" VARCHAR(30) NOT NULL,
    "fase_aquosa" DOUBLE PRECISION,
    "teor_etanol" DOUBLE PRECISION,
    "teor_alcoolico" DOUBLE PRECISION,
    "resultado" "ResultadoAnalise" NOT NULL,
    "boletim_url" VARCHAR(500),
    "foto_proveta_url" VARCHAR(500),
    "foto_amostra_url" VARCHAR(500),
    "distribuidora" VARCHAR(100),
    "nota_fiscal" VARCHAR(50),
    "placa_caminhao" VARCHAR(10),
    "tanque_destino" VARCHAR(50),
    "pdf_url" VARCHAR(500),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "afericoes" (
    "id" TEXT NOT NULL,
    "posto_id" TEXT NOT NULL,
    "responsavel_id" TEXT NOT NULL,
    "produto" "ProdutoCombustivel" NOT NULL,
    "bomba" INTEGER NOT NULL,
    "bico" INTEGER NOT NULL,
    "medida_padrao" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "resultado_ml" DOUBLE PRECISION NOT NULL,
    "situacao" "SituacaoAfericao" NOT NULL,
    "observacoes" TEXT,
    "fotos_urls" TEXT[],
    "relatorio_url" VARCHAR(500),
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "afericoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "posto_id" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "numero" VARCHAR(100),
    "data_emissao" DATE,
    "data_vencimento" DATE,
    "arquivo_url" VARCHAR(500),
    "status" "StatusDocumento" NOT NULL DEFAULT 'VALIDO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencoes" (
    "id" TEXT NOT NULL,
    "posto_id" TEXT NOT NULL,
    "equipamento" VARCHAR(100) NOT NULL,
    "tipo" "TipoManutencao" NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "StatusManutencao" NOT NULL DEFAULT 'ABERTA',
    "responsavel" VARCHAR(150) NOT NULL,
    "data_abertura" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fechamento" DATE,
    "fotos_urls" TEXT[],
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manutencoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drenagens" (
    "id" TEXT NOT NULL,
    "posto_id" TEXT NOT NULL,
    "tanque" VARCHAR(50) NOT NULL,
    "produto" "ProdutoCombustivel" NOT NULL,
    "data" DATE NOT NULL,
    "responsavel" VARCHAR(150) NOT NULL,
    "resultado" VARCHAR(200),
    "observacoes" TEXT,
    "fotos_urls" TEXT[],
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drenagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "postos_cnpj_key" ON "postos"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "colaboradores_user_id_key" ON "colaboradores"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "colaboradores_cpf_key" ON "colaboradores"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "treinamentos_colaborador_colaborador_id_curso_id_key" ON "treinamentos_colaborador"("colaborador_id", "curso_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_posto_id_fkey" FOREIGN KEY ("posto_id") REFERENCES "postos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_posto_id_fkey" FOREIGN KEY ("posto_id") REFERENCES "postos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treinamentos_colaborador" ADD CONSTRAINT "treinamentos_colaborador_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treinamentos_colaborador" ADD CONSTRAINT "treinamentos_colaborador_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raqs" ADD CONSTRAINT "raqs_posto_id_fkey" FOREIGN KEY ("posto_id") REFERENCES "postos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raqs" ADD CONSTRAINT "raqs_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "afericoes" ADD CONSTRAINT "afericoes_posto_id_fkey" FOREIGN KEY ("posto_id") REFERENCES "postos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_posto_id_fkey" FOREIGN KEY ("posto_id") REFERENCES "postos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes" ADD CONSTRAINT "manutencoes_posto_id_fkey" FOREIGN KEY ("posto_id") REFERENCES "postos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drenagens" ADD CONSTRAINT "drenagens_posto_id_fkey" FOREIGN KEY ("posto_id") REFERENCES "postos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
