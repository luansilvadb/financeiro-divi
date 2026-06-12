-- CreateEnum
CREATE TYPE "SplitMode" AS ENUM ('EQUAL', 'INCOME', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ValidationEventType" AS ENUM (
    'TENANT_CREATED',
    'SECOND_LINKED_MEMBER_JOINED',
    'FIRST_EXPENSE_CREATED',
    'PERIOD_CLOSED',
    'FIRST_SETTLEMENT_RECORDED'
);

-- Bring previously introduced business fields in sync with the Prisma schema.
ALTER TABLE "membros_casa" ADD COLUMN IF NOT EXISTS "renda_centavos" BIGINT;
ALTER TABLE "gastos" ADD COLUMN IF NOT EXISTS "is_private" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "gastos" ALTER COLUMN "fatura_id" DROP NOT NULL;
ALTER TABLE "gastos" ADD COLUMN "split_mode" "SplitMode" NOT NULL DEFAULT 'CUSTOM';

-- CreateTable
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "membro_id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "detalhes" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

DO $$ BEGIN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE "product_validation_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" "ValidationEventType" NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "period_key" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_validation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_validation_events_tenant_id_type_dedupe_key_key"
    ON "product_validation_events"("tenant_id", "type", "dedupe_key");
CREATE INDEX "product_validation_events_tenant_id_idx"
    ON "product_validation_events"("tenant_id");
CREATE INDEX "product_validation_events_tenant_id_created_at_idx"
    ON "product_validation_events"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "product_validation_events" ADD CONSTRAINT "product_validation_events_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
