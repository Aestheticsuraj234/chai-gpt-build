-- DropForeignKey
ALTER TABLE "Branch" DROP CONSTRAINT "Branch_leafMessageId_fkey";

-- AlterTable
ALTER TABLE "Branch" ALTER COLUMN "name" SET DEFAULT 'Main',
ALTER COLUMN "leafMessageId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_leafMessageId_fkey" FOREIGN KEY ("leafMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
