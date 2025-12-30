-- CreateTable
CREATE TABLE "Itenerary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Itenerary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Itenerary" ADD CONSTRAINT "Itenerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
