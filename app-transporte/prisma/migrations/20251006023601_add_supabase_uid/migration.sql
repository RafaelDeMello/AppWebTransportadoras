/*
  Warnings:

  - A unique constraint covering the columns `[supabaseUid]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `supabaseUid` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "supabaseUid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_supabaseUid_key" ON "usuarios"("supabaseUid");
