-- CreateEnum
CREATE TYPE "ImageFormats" AS ENUM ('png', 'jpeg', 'jpg');

-- CreateTable
CREATE TABLE "ProfilePictures" (
    "id" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "imageFromat" "ImageFormats" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProfilePictures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePictures_userId_key" ON "ProfilePictures"("userId");

-- AddForeignKey
ALTER TABLE "ProfilePictures" ADD CONSTRAINT "ProfilePictures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
