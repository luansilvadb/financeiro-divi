-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MORADOR', 'VISUALIZADOR');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_casa" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "role" "Role" NOT NULL DEFAULT 'MORADOR',
    "user_id" UUID,
    "cargo_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membros_casa_pkey" PRIMARY KEY ("id","tenant_id")
);

-- CreateTable
CREATE TABLE "cargos_casa" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT,
    "permissoes" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargos_casa_pkey" PRIMARY KEY ("id","tenant_id")
);

-- CreateTable
CREATE TABLE "cartoes" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "dia_fechamento" INTEGER NOT NULL,
    "responsavel_padrao_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cartoes_pkey" PRIMARY KEY ("id","tenant_id")
);

-- CreateTable
CREATE TABLE "faturas" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "cartao_id" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "responsavel_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data_pagamento_banco" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faturas_pkey" PRIMARY KEY ("id","tenant_id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "fatura_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor_total_centavos" BIGINT NOT NULL,
    "comprador_id" TEXT NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "total_installments" INTEGER NOT NULL DEFAULT 1,
    "is_loan" BOOLEAN NOT NULL DEFAULT false,
    "borrower_id" TEXT,
    "recurring_bill_id" TEXT,
    "is_settlement" BOOLEAN NOT NULL DEFAULT false,
    "settlement_details" JSONB,
    "method" TEXT NOT NULL DEFAULT 'pix',
    "card_owner_id" TEXT,
    "grupo_parcelas_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id","tenant_id")
);

-- CreateTable
CREATE TABLE "divisoes_gasto" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "gasto_id" TEXT NOT NULL,
    "membro_id" TEXT NOT NULL,
    "valor_centavos" BIGINT NOT NULL,

    CONSTRAINT "divisoes_gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_fixas" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "fixed_value_centavos" BIGINT,
    "default_split" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contas_fixas_pkey" PRIMARY KEY ("id","tenant_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_invite_code_key" ON "tenants"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "membros_casa_tenant_id_idx" ON "membros_casa"("tenant_id");

-- CreateIndex
CREATE INDEX "membros_casa_user_id_idx" ON "membros_casa"("user_id");

-- CreateIndex
CREATE INDEX "cartoes_tenant_id_idx" ON "cartoes"("tenant_id");

-- CreateIndex
CREATE INDEX "faturas_tenant_id_idx" ON "faturas"("tenant_id");

-- CreateIndex
CREATE INDEX "faturas_cartao_id_idx" ON "faturas"("cartao_id");

-- CreateIndex
CREATE INDEX "gastos_tenant_id_idx" ON "gastos"("tenant_id");

-- CreateIndex
CREATE INDEX "gastos_fatura_id_idx" ON "gastos"("fatura_id");

-- CreateIndex
CREATE INDEX "divisoes_gasto_tenant_id_idx" ON "divisoes_gasto"("tenant_id");

-- CreateIndex
CREATE INDEX "divisoes_gasto_gasto_id_tenant_id_idx" ON "divisoes_gasto"("gasto_id", "tenant_id");

-- CreateIndex
CREATE INDEX "contas_fixas_tenant_id_idx" ON "contas_fixas"("tenant_id");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_casa" ADD CONSTRAINT "membros_casa_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_casa" ADD CONSTRAINT "membros_casa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_casa" ADD CONSTRAINT "membros_casa_cargo_id_tenant_id_fkey" FOREIGN KEY ("cargo_id", "tenant_id") REFERENCES "cargos_casa"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargos_casa" ADD CONSTRAINT "cargos_casa_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartoes" ADD CONSTRAINT "cartoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisoes_gasto" ADD CONSTRAINT "divisoes_gasto_gasto_id_tenant_id_fkey" FOREIGN KEY ("gasto_id", "tenant_id") REFERENCES "gastos"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_fixas" ADD CONSTRAINT "contas_fixas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
