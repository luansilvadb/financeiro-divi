-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "permissions" JSONB DEFAULT '{}';
