-- AlterTable
ALTER TABLE "postos" ADD COLUMN     "max_administrativos" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "max_gerentes" INTEGER NOT NULL DEFAULT 1;
