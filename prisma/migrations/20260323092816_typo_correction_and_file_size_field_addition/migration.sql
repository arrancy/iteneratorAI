/*
  Warnings:

  - You are about to drop the column `imageFromat` on the `ProfilePictures` table. All the data in the column will be lost.
  - Added the required column `fileSize` to the `ProfilePictures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageFormat` to the `ProfilePictures` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProfilePictures" DROP COLUMN "imageFromat",
ADD COLUMN     "fileSize" INTEGER NOT NULL,
ADD COLUMN     "imageFormat" "ImageFormats" NOT NULL;
