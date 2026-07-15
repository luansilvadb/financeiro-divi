-- Migration 002: Add UNIQUE constraint for fatura upsert by composite key
-- The service layer now generates real UUIDs for faturas.id and looks up
-- existing records by (tenant_id, cartao_id, mes, ano) instead of by id.

ALTER TABLE faturas ADD CONSTRAINT faturas_tenant_cartao_mes_ano_key UNIQUE (tenant_id, cartao_id, mes, ano);
