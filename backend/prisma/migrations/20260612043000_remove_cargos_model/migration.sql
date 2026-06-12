-- DropForeignKey
ALTER TABLE "membros_casa" DROP CONSTRAINT IF EXISTS "membros_casa_cargo_id_fkey";
ALTER TABLE "cargos" DROP CONSTRAINT IF EXISTS "cargos_tenant_id_fkey";

-- AlterTable
ALTER TABLE "membros_casa" DROP COLUMN IF EXISTS "cargo_id";

-- DropTable
DROP TABLE IF EXISTS "cargos" CASCADE;
