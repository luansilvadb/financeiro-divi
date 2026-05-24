# Plano de Implementação: Evolução para SAAS Multitenant com Supabase

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evoluir o aplicativo DIVI de um gerenciador financeiro local no LocalStorage para um SaaS Multitenant integrado ao Supabase, permitindo cadastro por Nome/Senha, isolamento por RLS e convite por código, mantendo o modo offline caso o usuário não esteja logado.

**Architecture:** Implementação de novos repositórios baseados no Supabase sob as mesmas interfaces (`IGastoRepository`, etc.), introdução de um Proxy Dinâmico em `container.ts` para chavear as implementações, e um serviço de migração unidirecional no primeiro login.

**Tech Stack:** Vue 3, Vite, TypeScript, Vitest, `@supabase/supabase-js`.

---

### Task 1: Setup e Configuração do Supabase

**Files:**
- Modify: `package.json`
- Create: `src/shared/supabase.ts`
- Test: `src/shared/supabase.test.ts`

- [ ] **Step 1: Instalar a dependência do Supabase**
  Run: `npm install @supabase/supabase-js`
  Expected: Instalação bem-sucedida do SDK do Supabase.

- [ ] **Step 2: Criar arquivo de tipos globais para ambiente**
  Create: `src/vite-env.d.ts` (caso não exista, ou garanta que ele tem os tipos do Vite para variáveis de ambiente)
  ```typescript
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  ```

- [ ] **Step 3: Criar o inicializador do cliente do Supabase**
  Create: `src/shared/supabase.ts`
  ```typescript
  import { createClient } from '@supabase/supabase-js'

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  export const supabase = createClient(supabaseUrl, supabaseAnonKey)
  ```

- [ ] **Step 4: Criar o teste unitário de inicialização**
  Create: `src/shared/supabase.test.ts`
  ```typescript
  import { describe, it, expect, vi } from 'vitest'
  import { supabase } from './supabase'

  describe('Supabase Client Initializer', () => {
    it('deve exportar a instância do cliente supabase', () => {
      expect(supabase).toBeDefined()
      expect(supabase.auth).toBeDefined()
    })
  })
  ```

- [ ] **Step 5: Executar os testes**
  Run: `npx vitest run src/shared/supabase.test.ts`
  Expected: PASS

- [ ] **Step 6: Commit**
  ```bash
  git add package.json package-lock.json src/shared/supabase.ts src/shared/supabase.test.ts
  git commit -m "feat: setup do supabase client e instalacao de dependencias"
  ```

---

### Task 2: DDL de Tabelas no Supabase (Instalação do Banco)

**Files:**
- Create: `docs/superpowers/specs/ddl-supabase.sql`

- [ ] **Step 1: Escrever os scripts DDL das tabelas operacionais e segurança**
  Create: `docs/superpowers/specs/ddl-supabase.sql`
  ```sql
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
  ```

- [ ] **Step 2: Commit do script SQL**
  ```bash
  git add docs/superpowers/specs/ddl-supabase.sql
  git commit -m "docs: adicionar script SQL DDL para criacao das tabelas no Supabase"
  ```

---

### Task 3: Implementar o Serviço de Sessão de Inquilinos (`TenantSessionService`)

**Files:**
- Create: `src/models/services/TenantSessionService.ts`
- Create: `src/models/services/TenantSessionService.test.ts`

- [ ] **Step 1: Escrever teste de login, logout e active tenant**
  Create: `src/models/services/TenantSessionService.test.ts`
  ```typescript
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { TenantSessionService } from './TenantSessionService'

  const mockSupabase = {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn()
    },
    from: vi.fn()
  }

  describe('TenantSessionService', () => {
    let service: TenantSessionService

    beforeEach(() => {
      vi.clearAllMocks()
      localStorage.clear()
      service = new TenantSessionService(mockSupabase as any)
    })

    it('deve converter nome de usuário para e-mail fictício no login', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'usr-123' } }, error: null })
      
      const success = await service.login('Luan Silva', 'senha123')
      
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'luansilva@divi.app',
        password: 'senha123'
      })
      expect(success).toBe(true)
    })

    it('deve permitir definir e recuperar o active tenant id do localstorage', () => {
      service.setActiveTenant('tenant-456')
      expect(service.getActiveTenantId()).toBe('tenant-456')
      expect(localStorage.getItem('divi_active_tenant_id')).toBe('tenant-456')
    })
  })
  ```

- [ ] **Step 2: Rodar teste para verificar que falha**
  Run: `npx vitest run src/models/services/TenantSessionService.test.ts`
  Expected: FAIL (TenantSessionService não existe)

- [ ] **Step 3: Implementar o `TenantSessionService`**
  Create: `src/models/services/TenantSessionService.ts`
  ```typescript
  import type { SupabaseClient } from '@supabase/supabase-js'

  export class TenantSessionService {
    private activeTenantId: string | null = null

    constructor(private supabase: SupabaseClient) {
      this.activeTenantId = localStorage.getItem('divi_active_tenant_id')
    }

    private cleanUsername(username: string): string {
      return username
        .toLowerCase()
        .replace(/\s+/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    }

    private getEmailFromUsername(username: string): string {
      return `${this.cleanUsername(username)}@divi.app`
    }

    async login(username: string, password: string): Promise<boolean> {
      const email = this.getEmailFromUsername(username)
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Erro de login:', error.message)
        return false
      }

      return !!data.user
    }

    async register(username: string, password: string): Promise<boolean> {
      const email = this.getEmailFromUsername(username)
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        console.error('Erro de cadastro:', error.message)
        return false
      }

      return !!data.user
    }

    async logout(): Promise<void> {
      await this.supabase.auth.signOut()
      this.activeTenantId = null
      localStorage.removeItem('divi_active_tenant_id')
    }

    isAuthenticated(): boolean {
      // Verifica se há um usuário autenticado localmente na sessão ativa do cliente Supabase
      const user = localStorage.getItem('sb-' + import.meta.env.VITE_SUPABASE_URL + '-auth-token')
      return !!user
    }

    getActiveTenantId(): string | null {
      return this.activeTenantId
    }

    setActiveTenant(tenantId: string): void {
      this.activeTenantId = tenantId
      localStorage.setItem('divi_active_tenant_id', tenantId)
    }
  }
  ```

- [ ] **Step 4: Rodar teste para verificar que passa**
  Run: `npx vitest run src/models/services/TenantSessionService.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/models/services/TenantSessionService.ts src/models/services/TenantSessionService.test.ts
  git commit -m "feat: implementar TenantSessionService para gerenciamento de login e casas"
  ```

---

### Task 4: Criar Adaptadores de Repositório do Supabase

**Files:**
- Create: `src/models/repositories/supabase/SupabaseGastoRepository.ts`
- Create: `src/models/repositories/supabase/SupabaseGastoRepository.test.ts`
- (Outros repositórios serão gerados de forma análoga)

- [ ] **Step 1: Criar teste do GastoRepository do Supabase**
  Create: `src/models/repositories/supabase/SupabaseGastoRepository.test.ts`
  ```typescript
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { SupabaseGastoRepository } from './SupabaseGastoRepository'
  import { Gasto } from '../../entities/Gasto'
  import { Dinheiro } from '../../entities/Dinheiro'

  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnData([]),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }))
  }

  describe('SupabaseGastoRepository', () => {
    let repo: SupabaseGastoRepository

    beforeEach(() => {
      vi.clearAllMocks()
      repo = new SupabaseGastoRepository(mockSupabase as any, () => 'tenant-123')
    })

    it('deve instanciar o repositório', () => {
      expect(repo).toBeDefined()
    })
  })
  ```

- [ ] **Step 2: Rodar teste para verificar que falha**
  Run: `npx vitest run src/models/repositories/supabase/SupabaseGastoRepository.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implementar o `SupabaseGastoRepository`**
  Create: `src/models/repositories/supabase/SupabaseGastoRepository.ts`
  ```typescript
  import type { SupabaseClient } from '@supabase/supabase-js'
  import type { IGastoRepository } from '../IGastoRepository'
  import { Gasto } from '../../entities/Gasto'
  import { Dinheiro } from '../../entities/Dinheiro'
  import { DivisaoDeGasto } from '../../entities/DivisaoDeGasto'

  export class SupabaseGastoRepository implements IGastoRepository {
    constructor(
      private supabase: SupabaseClient,
      private getActiveTenantId: () => string
    ) {}

    async salvar(gasto: Gasto): Promise<void> {
      const tenantId = this.getActiveTenantId()
      if (!tenantId) throw new Error('Nenhuma casa ativa selecionada')

      // Insere ou atualiza o gasto
      const { error: gastoError } = await this.supabase.from('gastos').upsert({
        id: gasto.id,
        tenant_id: tenantId,
        fatura_id: gasto.faturaId,
        descricao: gasto.descricao,
        valor_total_centavos: gasto.valorTotal.centavos,
        comprador_id: gasto.compradorId,
        installments: gasto.installments,
        total_installments: gasto.totalInstallments,
        is_loan: gasto.isLoan,
        borrower_id: gasto.borrowerId,
        recurring_bill_id: gasto.recurringBillId,
        is_settlement: gasto.isSettlement,
        settlement_details: gasto.settlementDetails,
        method: gasto.method,
        card_owner_id: gasto.cardOwner,
        grupo_parcelas_id: gasto.grupoParcelasId
      })

      if (gastoError) throw new Error(`Erro ao salvar gasto: ${gastoError.message}`)

      // Limpa e reinsere as divisões do gasto
      await this.supabase.from('divisoes_gasto').delete().eq('gasto_id', gasto.id)

      const divisoesInserir = gasto.divisoes.map(d => ({
        gasto_id: gasto.id,
        membro_id: d.membroId,
        valor_centavos: d.valor.centavos
      }))

      if (divisoesInserir.length > 0) {
        const { error: divError } = await this.supabase.from('divisoes_gasto').insert(divisoesInserir)
        if (divError) throw new Error(`Erro ao salvar divisões do gasto: ${divError.message}`)
      }
    }

    async salvarMuitos(gastos: Gasto[]): Promise<void> {
      for (const gasto of gastos) {
        await this.salvar(gasto)
      }
    }

    async buscarPorFatura(faturaId: string): Promise<Gasto[]> {
      const tenantId = this.getActiveTenantId()
      const { data, error } = await this.supabase
        .from('gastos')
        .select(`
          *,
          divisoes_gasto (*)
        `)
        .eq('tenant_id', tenantId)
        .eq('fatura_id', faturaId)

      if (error) throw new Error(`Erro ao buscar gastos: ${error.message}`)
      if (!data) return []

      return data.map((g: any) => {
        const divisoes = (g.divisoes_gasto || []).map((d: any) => 
          new DivisaoDeGasto(d.membro_id, Dinheiro.deCentavos(Number(d.valor_centavos)))
        )
        return new Gasto({
          id: g.id,
          faturaId: g.fatura_id,
          descricao: g.descricao,
          valorTotal: Dinheiro.deCentavos(Number(g.valor_total_centavos)),
          compradorId: g.comprador_id,
          divisoes,
          installments: g.installments,
          totalInstallments: g.total_installments,
          isLoan: g.is_loan,
          borrowerId: g.borrower_id,
          recurringBillId: g.recurring_bill_id,
          isSettlement: g.is_settlement,
          settlementDetails: g.settlement_details,
          method: g.method,
          cardOwner: g.card_owner_id,
          grupoParcelasId: g.grupo_parcelas_id
        })
      })
    }

    async buscarPorId(id: string): Promise<Gasto | null> {
      const { data, error } = await this.supabase
        .from('gastos')
        .select(`
          *,
          divisoes_gasto (*)
        `)
        .eq('id', id)
        .single()

      if (error) return null

      const divisoes = (data.divisoes_gasto || []).map((d: any) => 
        new DivisaoDeGasto(d.membro_id, Dinheiro.deCentavos(Number(d.valor_centavos)))
      )

      return new Gasto({
        id: data.id,
        faturaId: data.fatura_id,
        descricao: data.descricao,
        valorTotal: Dinheiro.deCentavos(Number(data.valor_total_centavos)),
        compradorId: data.comprador_id,
        divisoes,
        installments: data.installments,
        totalInstallments: data.total_installments,
        isLoan: data.is_loan,
        borrowerId: data.borrower_id,
        recurringBillId: data.recurring_bill_id,
        isSettlement: data.is_settlement,
        settlementDetails: data.settlement_details,
        method: data.method,
        cardOwner: data.card_owner_id,
        grupoParcelasId: data.grupo_parcelas_id
      })
    }

    async excluir(id: string): Promise<void> {
      const { error } = await this.supabase.from('gastos').delete().eq('id', id)
      if (error) throw new Error(`Erro ao excluir gasto: ${error.message}`)
    }

    async excluirMuitos(ids: string[]): Promise<void> {
      const { error } = await this.supabase.from('gastos').delete().in('id', ids)
      if (error) throw new Error(`Erro ao excluir gastos: ${error.message}`)
    }

    async listarTodos(): Promise<Gasto[]> {
      const tenantId = this.getActiveTenantId()
      const { data, error } = await this.supabase
        .from('gastos')
        .select(`
          *,
          divisoes_gasto (*)
        `)
        .eq('tenant_id', tenantId)

      if (error) throw new Error(`Erro ao listar todos os gastos: ${error.message}`)
      if (!data) return []

      return data.map((g: any) => {
        const divisoes = (g.divisoes_gasto || []).map((d: any) => 
          new DivisaoDeGasto(d.membro_id, Dinheiro.deCentavos(Number(d.valor_centavos)))
        )
        return new Gasto({
          id: g.id,
          faturaId: g.fatura_id,
          descricao: g.descricao,
          valorTotal: Dinheiro.deCentavos(Number(g.valor_total_centavos)),
          compradorId: g.comprador_id,
          divisoes,
          installments: g.installments,
          totalInstallments: g.total_installments,
          isLoan: g.is_loan,
          borrowerId: g.borrower_id,
          recurringBillId: g.recurring_bill_id,
          isSettlement: g.is_settlement,
          settlementDetails: g.settlement_details,
          method: g.method,
          cardOwner: g.card_owner_id,
          grupoParcelasId: g.grupo_parcelas_id
        })
      })
    }
  }
  ```

- [ ] **Step 4: Rodar testes do GastoRepository do Supabase**
  Run: `npx vitest run src/models/repositories/supabase/SupabaseGastoRepository.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/models/repositories/supabase/SupabaseGastoRepository.ts src/models/repositories/supabase/SupabaseGastoRepository.test.ts
  git commit -m "feat: adicionar SupabaseGastoRepository com mapeamento para tabelas e divisoes"
  ```

- [ ] **Step 6: Repetir o processo e criar os adaptadores Supabase para Membro, Cartão, Fatura, Conta Fixa, Acerto e EventStore**
  *Nota para execução:* Devem ser criadas as classes `SupabaseMembroRepository`, `SupabaseCartaoRepository`, `SupabaseFaturaRepository`, `SupabaseContaFixaRepository`, `SupabaseAcertoMembroRepository` e `SupabaseEventStore` mapeando as interfaces atuais e apontando para as novas tabelas PostgreSQL.

---

### Task 5: Adaptar o Container de DI (`container.ts`) para Suportar Troca Dinâmica

**Files:**
- Modify: `src/shared/container.ts`

- [ ] **Step 1: Criar instâncias do Supabase e integrar o Proxy no container**
  Modify: `src/shared/container.ts`
  ```typescript
  import { supabase } from './supabase'
  import { TenantSessionService } from '../models/services/TenantSessionService'
  import { SupabaseGastoRepository } from '../models/repositories/supabase/SupabaseGastoRepository'
  // (Importar demais repositórios do Supabase...)
  import { LocalStorageGastoRepository } from '../models/repositories/local/LocalStorageGastoRepository'
  import type { IGastoRepository } from '../models/repositories/IGastoRepository'

  export const tenantSessionService = new TenantSessionService(supabase)

  const localGastoRepo = new LocalStorageGastoRepository()
  const supabaseGastoRepo = new SupabaseGastoRepository(supabase, () => tenantSessionService.getActiveTenantId() || '')

  class DynamicGastoRepository implements IGastoRepository {
    private get active(): IGastoRepository {
      return tenantSessionService.isAuthenticated() ? supabaseGastoRepo : localGastoRepo
    }

    async salvar(gasto: Gasto) { return this.active.salvar(gasto) }
    async salvarMuitos(gastos: Gasto[]) { return this.active.salvarMuitos(gastos) }
    async buscarPorFatura(faturaId: string) { return this.active.buscarPorFatura(faturaId) }
    async buscarPorId(id: string) { return this.active.buscarPorId(id) }
    async excluir(id: string) { return this.active.excluir(id) }
    async excluirMuitos(ids: string[]) { return this.active.excluirMuitos(ids) }
    async listarTodos() { return this.active.listarTodos() }
  }

  // Exporta a instância dinâmica com a mesma assinatura antiga
  export const gastoRepository = new DynamicGastoRepository()
  // ... (Repetir para os outros repositórios)
  ```

- [ ] **Step 2: Executar testes de integração do repositório dinâmico**
  Run: `npx vitest run src/App.test.ts`
  Expected: Todos os testes existentes do App continuam passando (pois a troca dinâmica cai em LocalStorage por padrão e respeita a interface).

- [ ] **Step 3: Commit**
  ```bash
  git add src/shared/container.ts
  git commit -m "feat: configurar container de DI com Proxy dinamico para chavear entre LocalStorage e Supabase"
  ```

---

### Task 6: Implementar o Serviço de Migração (`MigrationService`)

**Files:**
- Create: `src/models/services/MigrationService.ts`
- Create: `src/models/services/MigrationService.test.ts`

- [ ] **Step 1: Criar testes do MigrationService**
  Create: `src/models/services/MigrationService.test.ts`
  ```typescript
  import { describe, it, expect, vi } from 'vitest'
  import { MigrationService } from './MigrationService'

  describe('MigrationService', () => {
    it('deve migrar dados do localstorage para o supabase', async () => {
      // Implementação do teste de migração
    })
  })
  ```

- [ ] **Step 2: Implementar o `MigrationService`**
  Create: `src/models/services/MigrationService.ts`
  ```typescript
  import type { SupabaseClient } from '@supabase/supabase-js'
  import { LocalStorageGastoRepository } from '../repositories/local/LocalStorageGastoRepository'
  import { SupabaseGastoRepository } from '../repositories/supabase/SupabaseGastoRepository'
  // (Importar demais repositórios...)

  export class MigrationService {
    constructor(
      private supabase: SupabaseClient,
      private localGasto: LocalStorageGastoRepository,
      private supabaseGasto: SupabaseGastoRepository
      // (Demais repositórios...)
    ) {}

    async migrar(tenantId: string, currentUserId: string): Promise<void> {
      // 1. Pega membros locais e insere em membros_casa
      // Para o usuário logado atual, atribui o user_id. Para os outros, deixa null.
      // 2. Transfere todos os cartões, faturas, gastos e divisões para o Supabase
      // 3. Limpa o LocalStorage para marcar como concluído
    }
  }
  ```

- [ ] **Step 3: Executar testes do MigrationService**
  Run: `npx vitest run src/models/services/MigrationService.test.ts`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add src/models/services/MigrationService.ts src/models/services/MigrationService.test.ts
  git commit -m "feat: adicionar MigrationService para onboarding do LocalStorage ao Supabase"
  ```

---

### Task 7: Interface de Login, Criação de Casas e Seletor de Tenant

**Files:**
- Create: `src/views/screens/LoginScreen.vue`
- Create: `src/viewmodels/useLoginViewModel.ts`
- Modify: `src/views/screens/DashboardSaldos.vue`
- Modify: `src/App.vue`

- [ ] **Step 1: Criar ViewModel de Login e Registro**
  Create: `src/viewmodels/useLoginViewModel.ts`
  ```typescript
  import { ref } from 'vue'
  import { tenantSessionService } from '../shared/container'

  export function useLoginViewModel() {
    const username = ref('')
    const password = ref('')
    const errorMsg = ref('')

    const handleLogin = async () => {
      const success = await tenantSessionService.login(username.value, password.value)
      if (!success) errorMsg.value = 'Login falhou. Verifique o nome/senha.'
      return success
    }

    const handleRegister = async () => {
      const success = await tenantSessionService.register(username.value, password.value)
      if (!success) errorMsg.value = 'Erro ao criar conta.'
      return success
    }

    return { username, password, errorMsg, handleLogin, handleRegister }
  }
  ```

- [ ] **Step 2: Criar o componente de Login na UI**
  Create: `src/views/screens/LoginScreen.vue`
  *(Construir UI baseada nas cores quentes do Family: background #fbfaf9, botões do tipo Midnight pill #121212, inputs elegantes, etc.)*

- [ ] **Step 3: Criar modais para Entrada por Código de Convite e Criação de Casas**
  *Nota para execução:* Permitir que após o login o usuário crie uma nova casa (gerando o código `CASA-XXXXX`) ou digite um código de convite existente.

- [ ] **Step 4: Adicionar seletor de Casa no topo do Dashboard**
  Modify: `src/views/screens/DashboardSaldos.vue`
  *(Adicionar dropdown elegante no cabeçalho para listar as casas do usuário obtidas do Supabase e selecionar o Tenant Ativo, disparando o recarregamento dos dados).*

- [ ] **Step 5: Integrar tela de login e fluxo de migração no `App.vue`**
  Modify: `src/App.vue`
  *(Mostrar a tela de login se o usuário não estiver autenticado e disparar o MigrationService no primeiro login).*

- [ ] **Step 6: Executar a suite completa de testes**
  Run: `npx vitest run`
  Expected: Todos os testes de unidade e integração passando de forma limpa.

- [ ] **Step 7: Commit final do fluxo do front**
  ```bash
  git add src/views/screens/LoginScreen.vue src/viewmodels/useLoginViewModel.ts src/views/screens/DashboardSaldos.vue src/App.vue
  git commit -m "feat: implementar UI de login, onboarding de casas e seletor de tenant ativo"
  ```
