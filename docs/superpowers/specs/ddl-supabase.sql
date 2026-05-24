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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  limite_centavos bigint NOT NULL DEFAULT 0,
  dono_id text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Faturas
CREATE TABLE public.faturas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  periodo text NOT NULL,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabela de Gastos
CREATE TABLE public.gastos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fatura_id uuid NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  valor_total_centavos bigint NOT NULL,
  comprador_id text NOT NULL,
  installments integer NOT NULL DEFAULT 1,
  total_installments integer NOT NULL DEFAULT 1,
  is_loan boolean NOT NULL DEFAULT false,
  borrower_id text,
  recurring_bill_id uuid,
  is_settlement boolean NOT NULL DEFAULT false,
  settlement_details jsonb,
  method text NOT NULL DEFAULT 'pix',
  card_owner_id text,
  grupo_parcelas_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabela de Divisões de Gasto
CREATE TABLE public.divisoes_gasto (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gasto_id uuid NOT NULL REFERENCES public.gastos(id) ON DELETE CASCADE,
  membro_id text NOT NULL,
  valor_centavos bigint NOT NULL
);

-- 8. Tabela de Contas Fixas
CREATE TABLE public.contas_fixas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL,
  fixed_value_centavos bigint,
  default_split jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Tabela de Ledger Events
CREATE TABLE public.ledger_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type text NOT NULL,
  timestamp bigint NOT NULL,
  version integer NOT NULL,
  payload jsonb NOT NULL
);

-- 10. Configuração de RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membros_casa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisoes_gasto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_fixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_events ENABLE ROW LEVEL SECURITY;

-- 11. Políticas de Segurança (Isolamento por Membros da Casa cadastrados com auth.uid())
CREATE POLICY tenant_membros_casa_access ON public.membros_casa
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT t_m.tenant_id FROM public.membros_casa t_m 
      WHERE t_m.user_id = auth.uid()
    )
    OR user_id = auth.uid() -- Permite que ele se insira ao associar convite
  );

CREATE POLICY tenant_isolation_tenants ON public.tenants
  FOR ALL TO authenticated
  USING (
    id IN (
      SELECT t_m.tenant_id FROM public.membros_casa t_m 
      WHERE t_m.user_id = auth.uid()
    )
  );

CREATE POLICY tenant_isolation_cartoes ON public.cartoes
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT t_m.tenant_id FROM public.membros_casa t_m 
      WHERE t_m.user_id = auth.uid()
    )
  );

CREATE POLICY tenant_isolation_faturas ON public.faturas
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT t_m.tenant_id FROM public.membros_casa t_m 
      WHERE t_m.user_id = auth.uid()
    )
  );

CREATE POLICY tenant_isolation_gastos ON public.gastos
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT t_m.tenant_id FROM public.membros_casa t_m 
      WHERE t_m.user_id = auth.uid()
    )
  );

CREATE POLICY tenant_isolation_divisoes ON public.divisoes_gasto
  FOR ALL TO authenticated
  USING (
    gasto_id IN (
      SELECT g.id FROM public.gastos g
      JOIN public.membros_casa t_m ON g.tenant_id = t_m.tenant_id
      WHERE t_m.user_id = auth.uid()
    )
  );

CREATE POLICY tenant_isolation_contas_fixas ON public.contas_fixas
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT t_m.tenant_id FROM public.membros_casa t_m 
      WHERE t_m.user_id = auth.uid()
    )
  );

CREATE POLICY tenant_isolation_ledger_events ON public.ledger_events
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT t_m.tenant_id FROM public.membros_casa t_m 
      WHERE t_m.user_id = auth.uid()
    )
  );
