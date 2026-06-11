-- CreateTable
CREATE TABLE "categorias_documento" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" VARCHAR(300),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_documento_nome_key" ON "categorias_documento"("nome");

-- Seed default category for legacy documents
INSERT INTO "categorias_documento" ("id", "nome", "criado_em")
VALUES ('00000000-0000-0000-0000-000000000001', 'Sem categoria', CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "documentos"
ADD COLUMN     "categoria_id" TEXT,
ADD COLUMN     "titulo" VARCHAR(200);

-- AlterTable
ALTER TABLE "documentos"
ALTER COLUMN "arquivo_url" TYPE TEXT;

-- Backfill legacy rows before enforcing NOT NULL
UPDATE "documentos"
SET
    "categoria_id" = '00000000-0000-0000-0000-000000000001',
    "titulo" = CASE "tipo"
        WHEN 'AUTORIZACAO_ANP' THEN 'Autorização ANP'
        WHEN 'CONTRATO_DISTRIBUIDORA' THEN 'Contrato com Distribuidora'
        WHEN 'ALVARA_FUNCIONAMENTO' THEN 'Alvará de Funcionamento'
        WHEN 'ALVARA_SANITARIO' THEN 'Alvará Sanitário'
        WHEN 'LICENCA_AMBIENTAL' THEN 'Licença Ambiental'
        WHEN 'AVCB_BOMBEIROS' THEN 'Alvará do Bombeiro / AVCB'
        WHEN 'INMETRO_IPEM' THEN 'INMETRO / IPEM'
        WHEN 'CNPJ' THEN 'CNPJ'
        WHEN 'INSCRICAO_ESTADUAL' THEN 'Inscrição Estadual'
        WHEN 'FISPQ' THEN 'FISPQ'
        WHEN 'PARECER_TECNICO' THEN 'Parecer Técnico'
        WHEN 'OUTORGA' THEN 'Outorga'
        WHEN 'PLANTA_BAIXA' THEN 'Croqui / Planta Baixa'
        WHEN 'FOTO_FACHADA' THEN 'Foto da Fachada'
        ELSE 'Documento migrado'
    END
WHERE "categoria_id" IS NULL OR "titulo" IS NULL;

-- AlterTable
ALTER TABLE "documentos"
ALTER COLUMN "categoria_id" SET NOT NULL,
ALTER COLUMN "titulo" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "documentos"
ADD CONSTRAINT "documentos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop legacy enum-based field
ALTER TABLE "documentos"
DROP COLUMN "tipo";
