-- Migration 001: Initial Schema (PostgreSQL)
-- Equivalent to Prisma schema: backend/prisma/schema.prisma
--
-- All statements are written to be idempotent so this migration can safely run
-- after GORM AutoMigrate (which creates the same tables).  This allows
-- migration 002 (which adds the faturas UNIQUE constraint needed for ON CONFLICT
-- upserts) to execute without being blocked by a failed migration 001.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types: CREATE TYPE lacks IF NOT EXISTS, so we use DO blocks.
DO $$ BEGIN CREATE TYPE role AS ENUM ('ADMIN', 'MORADOR', 'VISUALIZADOR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE split_mode AS ENUM ('EQUAL', 'INCOME', 'CUSTOM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE validation_event_type AS ENUM ('TENANT_CREATED','SECOND_LINKED_MEMBER_JOINED','FIRST_EXPENSE_CREATED','PERIOD_CLOSED','FIRST_SETTLEMENT_RECORDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables (IF NOT EXISTS keeps them idempotent)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS membros_casa (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    avatar TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    role role NOT NULL DEFAULT 'MORADOR',
    user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    renda_centavos BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_membros_tenant ON membros_casa(tenant_id);
CREATE INDEX IF NOT EXISTS idx_membros_user ON membros_casa(user_id);

CREATE TABLE IF NOT EXISTS cartoes (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    dia_fechamento INT NOT NULL,
    responsavel_padrao_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, tenant_id),
    FOREIGN KEY (responsavel_padrao_id, tenant_id) REFERENCES membros_casa(id, tenant_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_cartoes_tenant ON cartoes(tenant_id);

CREATE TABLE IF NOT EXISTS faturas (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cartao_id UUID NOT NULL,
    mes INT NOT NULL,
    ano INT NOT NULL,
    responsavel_id UUID NOT NULL,
    status TEXT NOT NULL,
    data_pagamento_banco TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_faturas_tenant ON faturas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_faturas_cartao ON faturas(cartao_id);

CREATE TABLE IF NOT EXISTS gastos (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fatura_id UUID,
    descricao TEXT NOT NULL,
    valor_total_centavos BIGINT NOT NULL,
    comprador_id UUID NOT NULL,
    installments INT NOT NULL DEFAULT 1,
    total_installments INT NOT NULL DEFAULT 1,
    is_loan BOOLEAN NOT NULL DEFAULT FALSE,
    borrower_id UUID,
    recurring_bill_id UUID,
    is_settlement BOOLEAN NOT NULL DEFAULT FALSE,
    settlement_details JSONB,
    method TEXT NOT NULL DEFAULT 'pix',
    card_owner_id UUID,
    grupo_parcelas_id UUID,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    split_mode split_mode NOT NULL DEFAULT 'CUSTOM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_gastos_tenant ON gastos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fatura ON gastos(fatura_id);

CREATE TABLE IF NOT EXISTS divisoes_gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    gasto_id UUID NOT NULL,
    membro_id UUID NOT NULL,
    valor_centavos BIGINT NOT NULL,
    FOREIGN KEY (gasto_id, tenant_id) REFERENCES gastos(id, tenant_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_divisoes_tenant ON divisoes_gasto(tenant_id);

CREATE TABLE IF NOT EXISTS contas_fixas (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    fixed_value_centavos BIGINT,
    default_split JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_contas_fixas_tenant ON contas_fixas(tenant_id);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    membro_id UUID NOT NULL,
    acao TEXT NOT NULL,
    detalhes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);

CREATE TABLE IF NOT EXISTS product_validation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type validation_event_type NOT NULL,
    dedupe_key TEXT NOT NULL,
    period_key TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, type, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_validation_tenant ON product_validation_events(tenant_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
