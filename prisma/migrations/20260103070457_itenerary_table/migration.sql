/*
  Warnings:

  - A unique constraint covering the columns `[text]` on the table `Itenerary` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `text` to the `Itenerary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Itenerary" ADD COLUMN     "text" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Itenerary_text_key" ON "Itenerary"("text");
