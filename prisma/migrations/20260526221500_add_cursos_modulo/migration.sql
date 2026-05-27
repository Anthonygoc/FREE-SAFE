-- CreateEnum
CREATE TYPE "TipoConteudo" AS ENUM ('PDF_TEXTO', 'VIDEO_YOUTUBE', 'TEXTO_RICO');

-- CreateTable
CREATE TABLE "curso_conteudos" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "tipo" "TipoConteudo" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curso_conteudos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curso_questoes" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "enunciado" TEXT NOT NULL,
    "alternativas" JSONB NOT NULL,
    "gabarito" VARCHAR(1) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curso_questoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prova_attempts" (
    "id" TEXT NOT NULL,
    "colaborador_id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "aprovado" BOOLEAN NOT NULL,
    "certificado_url" VARCHAR(500),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prova_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prova_respostas" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "questao_id" TEXT NOT NULL,
    "resposta" VARCHAR(1) NOT NULL,
    "correta" BOOLEAN NOT NULL,

    CONSTRAINT "prova_respostas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "curso_conteudos" ADD CONSTRAINT "curso_conteudos_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_questoes" ADD CONSTRAINT "curso_questoes_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prova_attempts" ADD CONSTRAINT "prova_attempts_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prova_attempts" ADD CONSTRAINT "prova_attempts_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prova_respostas" ADD CONSTRAINT "prova_respostas_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "prova_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prova_respostas" ADD CONSTRAINT "prova_respostas_questao_id_fkey" FOREIGN KEY ("questao_id") REFERENCES "curso_questoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
