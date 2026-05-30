# Extração de Lógica Multitenant do Supabase - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extrair toda a lógica de gerenciamento de Casas/Tenants no Supabase de `DashboardSaldos.vue` para um Hook do Composition API isolado (`useCasasMultitenant.ts`), e cobri-lo com testes unitários.

**Architecture:** Encapsular estados de autenticação (`isAuthed`), listagem de casas, controle de diálogos (`showBottomSheetCasas`) e as operações de mutação do banco no Supabase em um Hook reutilizável de ViewModel, expondo apenas reativos e callbacks puros para a View.

**Tech Stack:** TypeScript, Vue 3, Vitest, Supabase client.

---

### Task 1: Estruturar o Hook e o arquivo de teste

**Files:**
- Create: `src/viewmodels/useCasasMultitenant.ts`
- Create: `src/viewmodels/useCasasMultitenant.test.ts`

- [ ] **Step 1: Criar o teste de montagem inicial (failing test)**
  Crie o arquivo `src/viewmodels/useCasasMultitenant.test.ts` para importar e instanciar o hook vazio:
  ```typescript
  import { describe, it, expect, beforeEach, vi } from 'vitest'
  import { createApp, defineComponent } from 'vue'
  import { useCasasMultitenant } from './useCasasMultitenant'

  function withSetup<T>(composable: () => T) {
    let result: T
    const app = createApp(defineComponent({
      setup() {
        result = composable()
        return () => {}
      }
    }))
    app.mount(document.createElement('div'))
    return [result!, app] as const
  }

  describe('useCasasMultitenant', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('deve inicializar com o estado padrão', () => {
      const [{ isAuthed, casas, showBottomSheetCasas }] = withSetup(() => useCasasMultitenant())
      expect(isAuthed.value).toBe(false)
      expect(casas.value).toEqual([])
      expect(showBottomSheetCasas.value).toBe(false)
    })
  })
  ```

- [ ] **Step 2: Rodar teste para verificar se falha**
  Run: `npx vitest run src/viewmodels/useCasasMultitenant.test.ts`
  Expected: FAIL (módulo não encontrado ou falha de importação)

- [ ] **Step 3: Criar a base do Hook**
  Crie o arquivo `src/viewmodels/useCasasMultitenant.ts` com o esqueleto mínimo:
  ```typescript
  import { ref, computed, onMounted } from 'vue'
  import { tenantSessionService } from '../shared/container'
  import { supabase } from '../shared/supabase'

  export function useCasasMultitenant() {
    const isAuthed = ref(tenantSessionService.isAuthenticated())
    const activeTenantId = ref(tenantSessionService.getActiveTenantId())
    const casas = ref<any[]>([])
    const showBottomSheetCasas = ref(false)
    const nomeNovaCasa = ref('')
    const codigoConvite = ref('')
    const errorCasa = ref('')
    const copied = ref(false)

    const activeTenantObj = computed(() => {
      return casas.value.find(c => c.id === activeTenantId.value) || null
    })

    return {
      isAuthed,
      activeTenantId,
      casas,
      showBottomSheetCasas,
      nomeNovaCasa,
      codigoConvite,
      errorCasa,
      copied,
      activeTenantObj
    }
  }
  ```

- [ ] **Step 4: Rodar teste para verificar se passa**
  Run: `npx vitest run src/viewmodels/useCasasMultitenant.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/viewmodels/useCasasMultitenant.ts src/viewmodels/useCasasMultitenant.test.ts
  git commit -m "feat: setup useCasasMultitenant hook skeleton and initial test"
  ```

---

### Task 2: Implementar Carregamento e Seleção de Casas

**Files:**
- Modify: `src/viewmodels/useCasasMultitenant.ts`
- Modify: `src/viewmodels/useCasasMultitenant.test.ts`

- [ ] **Step 1: Adicionar testes para carregarCasas e selecionarCasa**
  Escreva testes em `src/viewmodels/useCasasMultitenant.test.ts` mockando as respostas do Supabase client:
  ```typescript
  // Adicione no topo do arquivo useCasasMultitenant.test.ts
  vi.mock('../shared/container', () => ({
    tenantSessionService: {
      isAuthenticated: () => true,
      getActiveTenantId: () => 'tenant-123',
      getCurrentUserId: () => 'user-abc',
      setActiveTenant: vi.fn(),
      logout: vi.fn()
    }
  }))

  vi.mock('../shared/supabase', () => {
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'membros_casa') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockResolvedValue({ error: null })
        }
      }
      if (table === 'tenants') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: [{ id: 'tenant-123', name: 'Casa Feliz', invite_code: 'CODE123' }], error: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          single: vi.fn().mockReturnThis()
        }
      }
      return { select: vi.fn().mockReturnThis() }
    })
    return {
      supabase: {
        from: fromMock
      }
    }
  })
  ```
  E adicione o teste unitário correspondente:
  ```typescript
  it('deve carregar as casas e obter o objeto do tenant ativo', async () => {
    const [{ casas, activeTenantObj }, app] = withSetup(() => useCasasMultitenant())
    
    // Aguardar mounted hooks
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(casas.value.length).toBe(1)
    expect(casas.value[0].name).toBe('Casa Feliz')
    expect(activeTenantObj.value).toEqual({ id: 'tenant-123', name: 'Casa Feliz', invite_code: 'CODE123' })
    app.unmount()
  })
  ```

- [ ] **Step 2: Rodar teste para verificar se falha**
  Run: `npx vitest run src/viewmodels/useCasasMultitenant.test.ts`
  Expected: FAIL (porque `carregarCasas` não está implementada/chamada no mounted)

- [ ] **Step 3: Implementar carregarCasas e selecionarCasa no Hook**
  Adicione as funções em `src/viewmodels/useCasasMultitenant.ts`:
  ```typescript
  // Adicione dentro do hook useCasasMultitenant
  const carregarCasas = async () => {
    if (!isAuthed.value) return
    const { data: members, error: mError } = await supabase
      .from('membros_casa')
      .select('tenant_id')
      .eq('user_id', tenantSessionService.getCurrentUserId())
    
    if (mError || !members) return

    const tenantIds = members.map(m => m.tenant_id)
    if (tenantIds.length === 0) {
      casas.value = []
      return
    }

    const { data: tenantsList, error: tError } = await supabase
      .from('tenants')
      .select('*')
      .in('id', tenantIds)

    if (!tError && tenantsList) {
      casas.value = tenantsList
      const isValido = tenantsList.some(c => c.id === activeTenantId.value)
      if (!isValido || !activeTenantId.value) {
        if (tenantsList.length > 0) {
          selecionarCasa(tenantsList[0].id)
        } else {
          tenantSessionService.setActiveTenant('')
          activeTenantId.value = ''
        }
      }
    }
  }

  const selecionarCasa = (id: string) => {
    tenantSessionService.setActiveTenant(id)
    activeTenantId.value = id
    showBottomSheetCasas.value = false
    window.location.reload()
  }

  onMounted(() => {
    if (isAuthed.value) {
      carregarCasas()
    }
  })
  ```
  Exponha no retorno do hook:
  ```typescript
  return {
    isAuthed,
    activeTenantId,
    casas,
    showBottomSheetCasas,
    nomeNovaCasa,
    codigoConvite,
    errorCasa,
    copied,
    activeTenantObj,
    carregarCasas,
    selecionarCasa
  }
  ```

- [ ] **Step 4: Rodar teste para verificar se passa**
  Run: `npx vitest run src/viewmodels/useCasasMultitenant.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/viewmodels/useCasasMultitenant.ts src/viewmodels/useCasasMultitenant.test.ts
  git commit -m "feat: implement load and select house inside useCasasMultitenant"
  ```

---

### Task 3: Implementar Métodos de Mutação e Utilitários

**Files:**
- Modify: `src/viewmodels/useCasasMultitenant.ts`
- Modify: `src/viewmodels/useCasasMultitenant.test.ts`

- [ ] **Step 1: Adicionar testes de criar, entrar por código, cópia e logout**
  Adicione os testes correspondentes em `src/viewmodels/useCasasMultitenant.test.ts`:
  ```typescript
  it('deve permitir criar uma nova casa', async () => {
    const [{ nomeNovaCasa, criarNovaCasa }] = withSetup(() => useCasasMultitenant())
    nomeNovaCasa.value = 'República Central'
    await criarNovaCasa()
    // Deve chamar o supabase para inserir a nova casa
    expect(supabase.from).toHaveBeenCalledWith('tenants')
  })
  ```

- [ ] **Step 2: Rodar teste para verificar se falha**
  Run: `npx vitest run src/viewmodels/useCasasMultitenant.test.ts`
  Expected: FAIL (métodos não existem)

- [ ] **Step 3: Implementar métodos mutantes, cópia e logout no Hook**
  Adicione em `src/viewmodels/useCasasMultitenant.ts`:
  ```typescript
  const criarNovaCasa = async () => {
    errorCasa.value = ''
    if (!nomeNovaCasa.value.trim()) {
      errorCasa.value = 'Digite o nome da casa'
      return
    }

    const uuid = crypto.randomUUID()
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase()
    const code = `CASA-${randomSuffix}`

    const { error: tError } = await supabase.from('tenants').insert({
      id: uuid,
      name: nomeNovaCasa.value.trim(),
      invite_code: code
    })

    if (tError) {
      errorCasa.value = 'Erro ao criar casa: ' + tError.message
      return
    }

    const { error: mError } = await supabase.from('membros_casa').insert({
      id: tenantSessionService.getCurrentUserId()!,
      tenant_id: uuid,
      nome: localStorage.getItem('divi_username') || 'Membro Fundador',
      avatar: (localStorage.getItem('divi_username') || 'MF').substring(0, 2).toUpperCase(),
      user_id: tenantSessionService.getCurrentUserId()!
    })

    if (mError) {
      errorCasa.value = 'Erro ao associar membro: ' + mError.message
      return
    }

    nomeNovaCasa.value = ''
    await carregarCasas()
    selecionarCasa(uuid)
  }

  const entrarPorCodigo = async () => {
    errorCasa.value = ''
    const cleanedCode = codigoConvite.value.trim().toUpperCase()
    if (!cleanedCode) {
      errorCasa.value = 'Digite o código de convite'
      return
    }

    const { data: tenantData, error: tError } = await supabase
      .from('tenants')
      .select('*')
      .eq('invite_code', cleanedCode)
      .single()

    if (tError || !tenantData) {
      errorCasa.value = 'Código de convite inválido ou casa não encontrada.'
      return
    }

    const userId = tenantSessionService.getCurrentUserId()!
    const username = localStorage.getItem('divi_username') || 'Convidado'

    const { data: perfilExistente, error: pError } = await supabase
      .from('membros_casa')
      .select('*')
      .eq('tenant_id', tenantData.id)
      .eq('nome', username)
      .is('user_id', null)
      .limit(1)

    if (!pError && perfilExistente && perfilExistente.length > 0) {
      const { error: uError } = await supabase
        .from('membros_casa')
        .update({ user_id: userId })
        .eq('tenant_id', tenantData.id)
        .eq('id', perfilExistente[0].id)

      if (uError) {
        errorCasa.value = 'Erro ao vincular perfil: ' + uError.message
        return
      }
    } else {
      const { error: mError } = await supabase.from('membros_casa').insert({
        id: userId,
        tenant_id: tenantData.id,
        nome: username,
        avatar: username.substring(0, 2).toUpperCase(),
        user_id: userId
      })

      if (mError) {
        errorCasa.value = 'Erro ao entrar na casa: ' + mError.message
        return
      }
    }

    codigoConvite.value = ''
    await carregarCasas()
    selecionarCasa(tenantData.id)
  }

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      copied.value = true
      setTimeout(() => { copied.value = false }, 2000)
    } catch (err) {
      console.error('Falha ao copiar:', err)
    }
  }

  const handleLogoutClick = async () => {
    await tenantSessionService.logout()
    window.location.reload()
  }
  ```
  Exponha no retorno do hook:
  ```typescript
  return {
    isAuthed,
    activeTenantId,
    casas,
    showBottomSheetCasas,
    nomeNovaCasa,
    codigoConvite,
    errorCasa,
    copied,
    activeTenantObj,
    carregarCasas,
    selecionarCasa,
    criarNovaCasa,
    entrarPorCodigo,
    copyInviteCode,
    handleLogoutClick
  }
  ```

- [ ] **Step 4: Rodar testes e verificar sucesso**
  Run: `npx vitest run src/viewmodels/useCasasMultitenant.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/viewmodels/useCasasMultitenant.ts src/viewmodels/useCasasMultitenant.test.ts
  git commit -m "feat: complete useCasasMultitenant functions implementation and tests"
  ```

---

### Task 4: Integrar o Hook no DashboardSaldos.vue

**Files:**
- Modify: `src/views/screens/DashboardSaldos.vue`

- [ ] **Step 1: Limpar e integrar o novo hook**
  Substitua a lógica Supabase e de estados de casa antiga (linhas 147 a 329 em `DashboardSaldos.vue`) pela importação e invocação do hook:
  ```typescript
  // --- INTEGRAÇÃO SUPABASE MULTITENANT ---
  import { useCasasMultitenant } from '../../viewmodels/useCasasMultitenant'
  import { LogOut, Home, Copy, Check } from 'lucide-vue-next'

  const {
    isAuthed,
    activeTenantId,
    casas,
    showBottomSheetCasas,
    nomeNovaCasa,
    codigoConvite,
    errorCasa,
    copied,
    activeTenantObj,
    selecionarCasa,
    criarNovaCasa,
    entrarPorCodigo,
    copyInviteCode,
    handleLogoutClick
  } = useCasasMultitenant()
  ```
  *(Remover também os imports `tenantSessionService`, `supabase` e `onMounted` adicionais se não forem usados em outro lugar da tela)*

- [ ] **Step 2: Rodar todos os testes do DashboardSaldos**
  Run: `npx vitest run src/views/screens/DashboardSaldos.test.ts`
  Expected: PASS (todos os testes de tela continuam passando sem alteração de comportamento)

- [ ] **Step 3: Rodar a suíte completa de testes**
  Run: `npx vitest run`
  Expected: PASS (todos os 251 testes de regressão continuam passando)

- [ ] **Step 4: Validar build de produção**
  Run: `npm run build`
  Expected: Build completado com sucesso.

- [ ] **Step 5: Commit**
  ```bash
  git add src/views/screens/DashboardSaldos.vue
  git commit -m "refactor: migrate DashboardSaldos.vue multitenant logic to useCasasMultitenant hook"
  ```
