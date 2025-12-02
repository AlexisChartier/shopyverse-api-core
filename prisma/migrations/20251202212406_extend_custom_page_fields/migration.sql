-- AlterTable
ALTER TABLE "CustomPage" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "theme" TEXT;
