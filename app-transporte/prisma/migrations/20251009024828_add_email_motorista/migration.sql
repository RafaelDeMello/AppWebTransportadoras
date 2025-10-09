/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `motoristas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `motoristas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "motoristas" ADD COLUMN     "email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "motoristas_email_key" ON "motoristas"("email");
