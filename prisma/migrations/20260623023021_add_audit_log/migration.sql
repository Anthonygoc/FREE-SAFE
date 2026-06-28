-- CreateEnum
CREATE TYPE "AuditAcao" AS ENUM ('CRIAR', 'EDITAR', 'EXCLUIR', 'LOGIN', 'LOGOUT', 'EXPORTAR');

-- CreateEnum
CREATE TYPE "AuditRecurso" AS ENUM ('AFERICAO', 'BOMBA', 'RAQ', 'DOCUMENTO', 'COLABORADOR', 'USUARIO', 'CURSO', 'CERTIFICADO', 'CATEGORIA');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "usuario_nome" VARCHAR(150) NOT NULL,
    "usuario_email" VARCHAR(200) NOT NULL,
    "perfil" VARCHAR(30) NOT NULL,
    "acao" "AuditAcao" NOT NULL,
    "recurso" "AuditRecurso" NOT NULL,
    "entidade_id" TEXT,
    "posto_id" TEXT,
    "descricao" VARCHAR(300) NOT NULL,
    "detalhes" TEXT,
    "ip" VARCHAR(60),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_posto_id_criado_em_idx" ON "audit_logs"("posto_id", "criado_em");

-- CreateIndex
CREATE INDEX "audit_logs_usuario_id_criado_em_idx" ON "audit_logs"("usuario_id", "criado_em");

-- CreateIndex
CREATE INDEX "audit_logs_recurso_acao_idx" ON "audit_logs"("recurso", "acao");
