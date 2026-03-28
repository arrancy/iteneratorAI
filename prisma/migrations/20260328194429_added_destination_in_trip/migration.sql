/*
  Warnings:

  - Added the required column `destination` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "destination" TEXT NOT NULL;
