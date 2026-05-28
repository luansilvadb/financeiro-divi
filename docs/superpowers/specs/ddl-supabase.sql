-- 0. Limpeza prévia de tabelas antigas (opcional para recriar o esquema do zero)
DROP TABLE IF EXISTS public.divisoes_gasto CASCADE;
DROP TABLE IF EXISTS public.gastos CASCADE;
DROP TABLE IF EXISTS public.faturas CASCADE;
DROP TABLE IF EXISTS public.acertos_membro CASCADE;
DROP TABLE IF EXISTS public.cartoes CASCADE;
DROP TABLE IF EXISTS public.contas_fixas CASCADE;
DROP TABLE IF EXISTS public.membros_casa CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- 1. Habilitar uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Tenants
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Membros da Casa (Perfis)
CREATE TABLE public.membros_casa (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  avatar text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id, tenant_id)
);

-- 4. Tabela de Cartões
CREATE TABLE public.cartoes (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  dia_fechamento integer NOT NULL CHECK (dia_fechamento >= 1 AND dia_fechamento <= 31),
  responsavel_padrao_id text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id, tenant_id)
);

-- 5. Tabela de Faturas
CREATE TABLE public.faturas (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cartao_id text NOT NULL,
  mes integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano integer NOT NULL,
  responsavel_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('ABERTA', 'FECHADA', 'ACERTADA')),
  data_pagamento_banco timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id, tenant_id)
);

-- 6. Tabela de Gastos
CREATE TABLE public.gastos (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fatura_id text NOT NULL,
  descricao text NOT NULL,
  valor_total_centavos bigint NOT NULL,
  comprador_id text NOT NULL,
  installments integer NOT NULL DEFAULT 1,
  total_installments integer NOT NULL DEFAULT 1,
  is_loan boolean NOT NULL DEFAULT false,
  borrower_id text,
  recurring_bill_id text,
  is_settlement boolean NOT NULL DEFAULT false,
  settlement_details jsonb,
  method text NOT NULL DEFAULT 'pix',
  card_owner_id text,
  grupo_parcelas_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id, tenant_id)
);

-- 7. Tabela de Divisões de Gasto
CREATE TABLE public.divisoes_gasto (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  gasto_id text NOT NULL,
  membro_id text NOT NULL,
  valor_centavos bigint NOT NULL,
  FOREIGN KEY (gasto_id, tenant_id) REFERENCES public.gastos(id, tenant_id) ON DELETE CASCADE
);

-- 8. Tabela de Contas Fixas
CREATE TABLE public.contas_fixas (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL,
  fixed_value_centavos bigint,
  default_split jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id, tenant_id)
);

-- 9. Tabela de Acertos de Membros
CREATE TABLE public.acertos_membro (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fatura_id text NOT NULL,
  membro_id text NOT NULL,
  total_consumido_centavos bigint NOT NULL,
  valor_pago_centavos bigint NOT NULL DEFAULT 0,
  pago boolean NOT NULL DEFAULT false,
  data_pagamento timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id, tenant_id)
);

-- 10. Configuração de RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membros_casa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisoes_gasto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_fixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acertos_membro ENABLE ROW LEVEL SECURITY;

-- 11. Função auxiliar SECURITY DEFINER para quebrar a recursão de RLS
CREATE OR REPLACE FUNCTION public.get_user_tenants(user_uuid uuid)
RETURNS TABLE(t_id uuid) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.membros_casa WHERE user_id = user_uuid;
$$;

-- 12. Políticas de Segurança (Isolamento por Membros da Casa cadastrados com auth.uid())
CREATE POLICY tenant_membros_casa_access ON public.membros_casa
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR
    tenant_id IN (SELECT public.get_user_tenants(auth.uid()))
  );

CREATE POLICY tenant_isolation_tenants_select ON public.tenants
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT public.get_user_tenants(auth.uid()))
  );

CREATE POLICY tenant_isolation_tenants_insert ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY tenant_isolation_tenants_update ON public.tenants
  FOR UPDATE TO authenticated
  USING (
    id IN (SELECT public.get_user_tenants(auth.uid()))
  );

CREATE POLICY tenant_isolation_tenants_delete ON public.tenants
  FOR DELETE TO authenticated
  USING (
    id IN (SELECT public.get_user_tenants(auth.uid()))
  );

CREATE POLICY tenant_isolation_cartoes ON public.cartoes
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT public.get_user_tenants(auth.uid()))
  );

CREATE POLICY tenant_isolation_faturas ON public.faturas
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT public.get_user_tenants(auth.uid()))
  );

CREATE POLICY tenant_isolation_gastos ON public.gastos
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT public.get_user_tenants(auth.uid()))
  );

CREATE POLICY tenant_isolation_divisoes ON public.divisoes_gasto
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT public.get_user_tenants(auth.uid()))
  );

CREATE POLICY tenant_isolation_contas_fixas ON public.contas_fixas
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT public.get_user_tenants(auth.uid()))
  );

CREATE POLICY tenant_isolation_acertos ON public.acertos_membro
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT public.get_user_tenants(auth.uid()))
  );

-- 13. Concessão de Privilégios para as roles do Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, authenticated, service_role;
