-- AlterTable
ALTER TABLE "afericoes" ADD COLUMN     "bico_id" TEXT,
ADD COLUMN     "foto_url" VARCHAR(500);

-- CreateTable
CREATE TABLE "bombas" (
    "id" TEXT NOT NULL,
    "posto_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "modelo" VARCHAR(100),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bombas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bicos" (
    "id" TEXT NOT NULL,
    "bomba_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "produto" "ProdutoCombustivel" NOT NULL,
    "capacidade" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bicos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bombas_posto_id_numero_key" ON "bombas"("posto_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "bicos_bomba_id_numero_key" ON "bicos"("bomba_id", "numero");

-- AddForeignKey
ALTER TABLE "bombas" ADD CONSTRAINT "bombas_posto_id_fkey" FOREIGN KEY ("posto_id") REFERENCES "postos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bicos" ADD CONSTRAINT "bicos_bomba_id_fkey" FOREIGN KEY ("bomba_id") REFERENCES "bombas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "afericoes" ADD CONSTRAINT "afericoes_bico_id_fkey" FOREIGN KEY ("bico_id") REFERENCES "bicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
