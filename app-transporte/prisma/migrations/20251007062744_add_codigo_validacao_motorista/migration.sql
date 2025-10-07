/*
  Warnings:

  - A unique constraint covering the columns `[codigoValidacao]` on the table `motoristas` will be added. If there are existing duplicate values, this will fail.
  - Made the column `email` on table `transportadoras` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "motoristas" ADD COLUMN     "codigoValidacao" TEXT,
ADD COLUMN     "validado" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "cnh" DROP NOT NULL,
ALTER COLUMN "telefone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "transportadoras" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "motoristas_codigoValidacao_key" ON "motoristas"("codigoValidacao");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_transportadoraId_fkey" FOREIGN KEY ("transportadoraId") REFERENCES "transportadoras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "motoristas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motoristas" ADD CONSTRAINT "motoristas_transportadoraId_fkey" FOREIGN KEY ("transportadoraId") REFERENCES "transportadoras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viagens" ADD CONSTRAINT "viagens_transportadoraId_fkey" FOREIGN KEY ("transportadoraId") REFERENCES "transportadoras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viagens" ADD CONSTRAINT "viagens_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "motoristas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acertos" ADD CONSTRAINT "acertos_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
