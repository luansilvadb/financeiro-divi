DROP TABLE IF EXISTS "cargos" CASCADE;
DROP TABLE IF EXISTS "cargos_casa" CASCADE;
ALTER TABLE "membros_casa" DROP COLUMN IF EXISTS "cargo_id";

-- CreateTable
CREATE TABLE "cargos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT,
    "permissoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cargos_tenant_id_idx" ON "cargos"("tenant_id");

-- AlterTable
ALTER TABLE "membros_casa" ADD COLUMN "cargo_id" UUID;

-- AddForeignKey
ALTER TABLE "cargos" ADD CONSTRAINT "cargos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_casa" ADD CONSTRAINT "membros_casa_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
