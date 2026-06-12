-- CreateEnum
CREATE TYPE "Permissao" AS ENUM ('LANCAR_GASTOS', 'GERENCIAR_CARTOES', 'GERENCIAR_FATURAS', 'GERENCIAR_CONTAS_FIXAS', 'VISUALIZAR_AUDITORIA');

CREATE TABLE IF NOT EXISTS "cargos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT,
    "permissoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- AlterTable: drop default, change type, set new default
ALTER TABLE "cargos" ALTER COLUMN "permissoes" DROP DEFAULT;
ALTER TABLE "cargos" ALTER COLUMN "permissoes" TYPE "Permissao"[] USING ARRAY[]::"Permissao"[];
ALTER TABLE "cargos" ALTER COLUMN "permissoes" SET DEFAULT ARRAY[]::"Permissao"[];
