# Ciclos de Gasto e Pagamento - UI e Integração Focada em Cartões

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar os ciclos de gasto e pagamento (Cartões, Faturas, Gastos, Antecipações e Acertos) na interface do usuário do DIVI, focado 100% no fluxo de Cartões de Crédito no Dashboard e no Wizard de Lançamentos.

**Architecture:** A camada de UI se comunica com o domínio por meio de Composables do Vue 3 reativos. Persistiremos as entidades no `localStorage` por meio de adaptadores locais robustos com proteção multi-aba via `StorageLock`, orquestrando as operações de fechamento e acerto com os serviços `FaturaService` e `AcertoService`.

**Tech Stack:** Vue 3 (Composition API), Vitest, TypeScript, LocalStorage API, Web Locks API.

---

## Mapeamento de Arquivos a Serem Criados/Modificados

### Criar:
- `src/modules/ledger/adapters/LocalStorageCartaoRepository.ts` (Persistência de Cartões)
- `src/modules/ledger/adapters/LocalStorageCartaoRepository.test.ts` (Testes do repositório)
- `src/modules/ledger/adapters/LocalStorageFaturaRepository.ts` (Persistência de Faturas)
- `src/modules/ledger/adapters/LocalStorageFaturaRepository.test.ts` (Testes do repositório)
- `src/modules/ledger/adapters/LocalStorageGastoRepository.ts` (Persistência de Gastos)
- `src/modules/ledger/adapters/LocalStorageGastoRepository.test.ts` (Testes do repositório)
- `src/modules/ledger/adapters/LocalStorageAntecipacaoRepository.ts` (Persistência de Antecipações)
- `src/modules/ledger/adapters/LocalStorageAntecipacaoRepository.test.ts` (Testes do repositório)
- `src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.ts` (Persistência de Acertos)
- `src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.test.ts` (Testes do repositório)
- `src/modules/ledger/composables/useCartoesEFaturas.ts` (Composables reativos para a UI)

### Modificar:
- `src/components/ledger/DashboardSaldos.vue` (Visualização 100% focada em Faturas)
- `src/modules/ledger/composables/useNovoLancamentoWizard.ts` (Suporte a gastos de cartão)
- `src/components/ledger/NovoLancamentoWizard.vue` (Visualização de Cartões e Faturas no Wizard)

---

### Task 1: Repositório de Cartões (LocalStorageCartaoRepository)

**Files:**
- Create: `src/modules/ledger/adapters/LocalStorageCartaoRepository.ts`
- Test: `src/modules/ledger/adapters/LocalStorageCartaoRepository.test.ts`

- [ ] **Step 1: Escrever teste que falha**
  Criar o arquivo `src/modules/ledger/adapters/LocalStorageCartaoRepository.test.ts` com o seguinte caso de teste:
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest'
  import { LocalStorageCartaoRepository } from './LocalStorageCartaoRepository'
  import { Cartao } from '../core/domain/Cartao'

  describe('LocalStorageCartaoRepository', () => {
    let repo: LocalStorageCartaoRepository

    beforeEach(() => {
      localStorage.clear()
      repo = new LocalStorageCartaoRepository()
    })

    it('deve salvar e buscar um cartao por ID', async () => {
      const cartao = new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' })
      await repo.salvar(cartao)
      const salvo = await repo.buscarPorId('c1')
      expect(salvo).not.toBeNull()
      expect(salvo!.nome).toBe('Nubank')
    })
  })
  ```

- [ ] **Step 2: Executar teste e verificar falha**
  Run: `npx vitest run src/modules/ledger/adapters/LocalStorageCartaoRepository.test.ts`
  Expected: FAIL (Cannot find module)

- [ ] **Step 3: Implementar o repositório**
  Criar `src/modules/ledger/adapters/LocalStorageCartaoRepository.ts`:
  ```typescript
  import { ICartaoRepository } from '../core/ports/ICartaoRepository'
  import { Cartao } from '../core/domain/Cartao'
  import { StorageLock } from '../../../shared/utils/StorageLock'

  export class LocalStorageCartaoRepository implements ICartaoRepository {
    private readonly STORAGE_KEY = 'divi_cartoes'

    async salvar(cartao: Cartao): Promise<void> {
      await StorageLock.executarAtomico('lock_divi_cartoes', async () => {
        const todos = await this.listarTodos()
        const index = todos.findIndex(c => c.id === cartao.id)
        if (index >= 0) {
          todos[index] = cartao
        } else {
          todos.push(cartao)
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos))
      })
    }

    async buscarPorId(id: string): Promise<Cartao | null> {
      const todos = await this.listarTodos()
      return todos.find(c => c.id === id) || null
    }

    async listarTodos(): Promise<Cartao[]> {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return []
      try {
        const raw = JSON.parse(data) as any[]
        return raw.map(c => new Cartao(c))
      } catch (e) {
        console.error(e)
        return []
      }
    }
  }
  ```

- [ ] **Step 4: Verificar sucesso dos testes**
  Run: `npx vitest run src/modules/ledger/adapters/LocalStorageCartaoRepository.test.ts`
  Expected: PASS

- [ ] **Step 5: Fazer commit do progresso**
  ```bash
  git add src/modules/ledger/adapters/LocalStorageCartaoRepository*
  git commit -m "feat(adapters): implement LocalStorageCartaoRepository"
  ```

---

### Task 2: Repositório de Faturas (LocalStorageFaturaRepository)

**Files:**
- Create: `src/modules/ledger/adapters/LocalStorageFaturaRepository.ts`
- Test: `src/modules/ledger/adapters/LocalStorageFaturaRepository.test.ts`

- [ ] **Step 1: Escrever teste que falha**
  Criar o arquivo `src/modules/ledger/adapters/LocalStorageFaturaRepository.test.ts` com o caso de teste:
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest'
  import { LocalStorageFaturaRepository } from './LocalStorageFaturaRepository'
  import { Fatura } from '../core/domain/Fatura'

  describe('LocalStorageFaturaRepository', () => {
    let repo: LocalStorageFaturaRepository

    beforeEach(() => {
      localStorage.clear()
      repo = new LocalStorageFaturaRepository()
    })

    it('deve salvar e buscar uma fatura por ID', async () => {
      const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
      await repo.salvar(fatura)
      const salvo = await repo.buscarPorId('f1')
      expect(salvo).not.toBeNull()
      expect(salvo!.status).toBe('ABERTA')
    })
  })
  ```

- [ ] **Step 2: Executar teste e verificar falha**
  Run: `npx vitest run src/modules/ledger/adapters/LocalStorageFaturaRepository.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implementar o repositório**
  Criar `src/modules/ledger/adapters/LocalStorageFaturaRepository.ts`:
  ```typescript
  import { IFaturaRepository } from '../core/ports/IFaturaRepository'
  import { Fatura, FaturaPeriodo } from '../core/domain/Fatura'
  import { StorageLock } from '../../../shared/utils/StorageLock'

  export class LocalStorageFaturaRepository implements IFaturaRepository {
    private readonly STORAGE_KEY = 'divi_faturas'

    async salvar(fatura: Fatura): Promise<void> {
      await StorageLock.executarAtomico('lock_divi_faturas', async () => {
        const todas = await this.listarTodas()
        const index = todas.findIndex(f => f.id === fatura.id)
        if (index >= 0) {
          todas[index] = fatura
        } else {
          todas.push(fatura)
        }
        // Persistir como DTO estruturado
        const dtos = todas.map(f => ({
          id: f.id,
          cartaoId: f.cartaoId,
          periodo: f.periodo,
          responsavelId: f.responsavelId,
          status: f.status,
          dataPagamentoBanco: f.dataPagamentoBanco ? f.dataPagamentoBanco.toISOString() : undefined
        }))
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
      })
    }

    async buscarPorId(id: string): Promise<Fatura | null> {
      const todas = await this.listarTodas()
      return todas.find(f => f.id === id) || null
    }

    async buscarPorCartaoEPeriodo(cartaoId: string, periodo: FaturaPeriodo): Promise<Fatura | null> {
      const todas = await this.listarTodas()
      return todas.find(f => f.cartaoId === cartaoId && f.periodo.mes === periodo.mes && f.periodo.ano === periodo.ano) || null
    }

    async listarTodas(): Promise<Fatura[]> {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return []
      try {
        const raw = JSON.parse(data) as any[]
        return raw.map(f => new Fatura({
          ...f,
          dataPagamentoBanco: f.dataPagamentoBanco ? new Date(f.dataPagamentoBanco) : undefined
        }))
      } catch (e) {
        console.error(e)
        return []
      }
    }
  }
  ```

- [ ] **Step 4: Verificar sucesso dos testes**
  Run: `npx vitest run src/modules/ledger/adapters/LocalStorageFaturaRepository.test.ts`
  Expected: PASS

- [ ] **Step 5: Fazer commit do progresso**
  ```bash
  git add src/modules/ledger/adapters/LocalStorageFaturaRepository*
  git commit -m "feat(adapters): implement LocalStorageFaturaRepository"
  ```

---

### Task 3: Repositórios de Gastos, Antecipações e Acertos

**Files:**
- Create: `src/modules/ledger/adapters/LocalStorageGastoRepository.ts`
- Create: `src/modules/ledger/adapters/LocalStorageAntecipacaoRepository.ts`
- Create: `src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.ts`
- Test: `src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.test.ts`

- [ ] **Step 1: Escrever teste que falha**
  Criar o arquivo `src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.test.ts` com o caso de teste:
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest'
  import { LocalStorageAcertoMembroRepository } from './LocalStorageAcertoMembroRepository'
  import { AcertoMembro } from '../core/domain/AcertoMembro'
  import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

  describe('LocalStorageAcertoMembroRepository', () => {
    let repo: LocalStorageAcertoMembroRepository

    beforeEach(() => {
      localStorage.clear()
      repo = new LocalStorageAcertoMembroRepository()
    })

    it('deve salvar, buscar por ID e buscar por fatura', async () => {
      const acerto = new AcertoMembro({
        id: 'a1',
        faturaId: 'f1',
        membroId: 'm1',
        totalConsumido: Dinheiro.deCentavos(100),
        totalAntecipado: Dinheiro.deCentavos(50)
      })
      await repo.salvar(acerto)
      const salvo = await repo.buscarPorId('a1')
      expect(salvo).not.toBeNull()
      expect(salvo!.valorAcerto.centavos).toBe(50)
      
      const porFatura = await repo.buscarPorFatura('f1')
      expect(porFatura.length).toBe(1)
    })
  })
  ```

- [ ] **Step 2: Executar teste e verificar falha**
  Run: `npx vitest run src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implementar os repositórios**
  Criar `src/modules/ledger/adapters/LocalStorageGastoRepository.ts`:
  ```typescript
  import { IGastoRepository } from '../core/ports/IGastoRepository'
  import { Gasto } from '../core/domain/Gasto'
  import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
  import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'
  import { StorageLock } from '../../../shared/utils/StorageLock'

  export class LocalStorageGastoRepository implements IGastoRepository {
    private readonly STORAGE_KEY = 'divi_gastos_cartao'

    async salvar(gasto: Gasto): Promise<void> {
      await StorageLock.executarAtomico('lock_divi_gastos_cartao', async () => {
        const todos = await this.listarTodos()
        const index = todos.findIndex(g => g.id === gasto.id)
        if (index >= 0) {
          todos[index] = gasto
        } else {
          todos.push(gasto)
        }
        const dtos = todos.map(g => ({
          id: g.id,
          faturaId: g.faturaId,
          descricao: g.descricao,
          valorTotalCentavos: g.valorTotal.centavos,
          divisoes: g.divisoes.map(d => ({ membroId: d.membroId, centavos: d.valor.centavos }))
        }))
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
      })
    }

    async buscarPorFatura(faturaId: string): Promise<Gasto[]> {
      const todos = await this.listarTodos()
      return todos.filter(g => g.faturaId === faturaId)
    }

    private async listarTodos(): Promise<Gasto[]> {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return []
      try {
        const raw = JSON.parse(data) as any[]
        return raw.map(g => new Gasto({
          id: g.id,
          faturaId: g.faturaId,
          descricao: g.descricao,
          valorTotal: Dinheiro.deCentavos(g.valorTotalCentavos),
          divisoes: g.divisoes.map((d: any) => new DivisaoDeGasto(d.membroId, Dinheiro.deCentavos(d.centavos)))
        }))
      } catch (e) {
        console.error(e)
        return []
      }
    }
  }
  ```

  Criar `src/modules/ledger/adapters/LocalStorageAntecipacaoRepository.ts`:
  ```typescript
  import { IAntecipacaoRepository } from '../core/ports/IAntecipacaoRepository'
  import { Antecipacao } from '../core/domain/Antecipacao'
  import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
  import { StorageLock } from '../../../shared/utils/StorageLock'

  export class LocalStorageAntecipacaoRepository implements IAntecipacaoRepository {
    private readonly STORAGE_KEY = 'divi_antecipacoes'

    async salvar(antecipacao: Antecipacao): Promise<void> {
      await StorageLock.executarAtomico('lock_divi_antecipacoes', async () => {
        const todas = await this.listarTodas()
        const index = todas.findIndex(a => a.id === antecipacao.id)
        if (index >= 0) {
          todas[index] = antecipacao
        } else {
          todas.push(antecipacao)
        }
        const dtos = todas.map(a => ({
          id: a.id,
          faturaId: a.faturaId,
          membroId: a.membroId,
          valorCentavos: a.valor.centavos,
          data: a.data.toISOString()
        }))
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
      })
    }

    async buscarPorFatura(faturaId: string): Promise<Antecipacao[]> {
      const todas = await this.listarTodas()
      return todas.filter(a => a.faturaId === faturaId)
    }

    private async listarTodas(): Promise<Antecipacao[]> {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return []
      try {
        const raw = JSON.parse(data) as any[]
        return raw.map(a => new Antecipacao({
          id: a.id,
          faturaId: a.faturaId,
          membroId: a.membroId,
          valor: Dinheiro.deCentavos(a.valorCentavos),
          data: new Date(a.data)
        }))
      } catch (e) {
        console.error(e)
        return []
      }
    }
  }
  ```

  Criar `src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.ts`:
  ```typescript
  import { IAcertoMembroRepository } from '../core/ports/IAcertoMembroRepository'
  import { AcertoMembro } from '../core/domain/AcertoMembro'
  import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
  import { StorageLock } from '../../../shared/utils/StorageLock'

  export class LocalStorageAcertoMembroRepository implements IAcertoMembroRepository {
    private readonly STORAGE_KEY = 'divi_acertos_membro'

    async salvar(acerto: AcertoMembro): Promise<void> {
      await StorageLock.executarAtomico('lock_divi_acertos_membro', async () => {
        const todos = await this.listarTodos()
        const index = todos.findIndex(a => a.id === acerto.id)
        if (index >= 0) {
          todos[index] = acerto
        } else {
          todos.push(acerto)
        }
        const dtos = todos.map(a => ({
          id: a.id,
          faturaId: a.faturaId,
          membroId: a.membroId,
          totalConsumidoCentavos: a.totalConsumido.centavos,
          totalAntecipadoCentavos: a.totalAntecipado.centavos,
          pago: a.pago,
          dataPagamento: a.dataPagamento ? a.dataPagamento.toISOString() : undefined
        }))
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
      })
    }

    async buscarPorId(id: string): Promise<AcertoMembro | null> {
      const todos = await this.listarTodos()
      return todos.find(a => a.id === id) || null
    }

    async buscarPorFatura(faturaId: string): Promise<AcertoMembro[]> {
      const todos = await this.listarTodos()
      return todos.filter(a => a.faturaId === faturaId)
    }

    private async listarTodos(): Promise<AcertoMembro[]> {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return []
      try {
        const raw = JSON.parse(data) as any[]
        return raw.map(a => new AcertoMembro({
          id: a.id,
          faturaId: a.faturaId,
          membroId: a.membroId,
          totalConsumido: Dinheiro.deCentavos(a.totalConsumidoCentavos),
          totalAntecipado: Dinheiro.deCentavos(a.totalAntecipadoCentavos),
          pago: a.pago,
          dataPagamento: a.dataPagamento ? new Date(a.dataPagamento) : undefined
        }))
      } catch (e) {
        console.error(e)
        return []
      }
    }
  }
  ```

- [ ] **Step 4: Verificar sucesso dos testes**
  Run: `npx vitest run src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.test.ts`
  Expected: PASS

- [ ] **Step 5: Fazer commit do progresso**
  ```bash
  git add src/modules/ledger/adapters/LocalStorageGastoRepository* src/modules/ledger/adapters/LocalStorageAntecipacaoRepository* src/modules/ledger/adapters/LocalStorageAcertoMembroRepository*
  git commit -m "feat(adapters): implement LocalStorage repositories for spending, anticipations and member settlements"
  ```

---

### Task 4: Composable Reativo de Cartões e Faturas (useCartoesEFaturas)

**Files:**
- Create: `src/modules/ledger/composables/useCartoesEFaturas.ts`

- [ ] **Step 1: Implementar o Composable reativo**
  Criar o arquivo `src/modules/ledger/composables/useCartoesEFaturas.ts` para orquestrar faturas, gastos e acertos na camada de UI:
  ```typescript
  import { ref, computed } from 'vue'
  import { LocalStorageCartaoRepository } from '../adapters/LocalStorageCartaoRepository'
  import { LocalStorageFaturaRepository } from '../adapters/LocalStorageFaturaRepository'
  import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
  import { LocalStorageAntecipacaoRepository } from '../adapters/LocalStorageAntecipacaoRepository'
  import { LocalStorageAcertoMembroRepository } from '../adapters/LocalStorageAcertoMembroRepository'
  import { FaturaService } from '../core/services/FaturaService'
  import { AcertoService } from '../core/services/AcertoService'
  import { Cartao } from '../core/domain/Cartao'
  import { Fatura } from '../core/domain/Fatura'
  import { AcertoMembro } from '../core/domain/AcertoMembro'
  import { Gasto } from '../core/domain/Gasto'

  const cartaoRepo = new LocalStorageCartaoRepository()
  const faturaRepo = new LocalStorageFaturaRepository()
  const gastoRepo = new LocalStorageGastoRepository()
  const antRepo = new LocalStorageAntecipacaoRepository()
  const acertoRepo = new LocalStorageAcertoMembroRepository()

  const faturaService = new FaturaService(faturaRepo, gastoRepo, antRepo, acertoRepo)
  const acertoService = new AcertoService(acertoRepo, faturaRepo)

  export function useCartoesEFaturas() {
    const cartoes = ref<Cartao[]>([])
    const faturas = ref<Fatura[]>([])
    const acertos = ref<AcertoMembro[]>([])
    const gastos = ref<Gasto[]>([])

    const inicializar = async () => {
      // Migração inicial de cartões padrão se vazio
      let todosCartoes = await cartaoRepo.listarTodos()
      if (todosCartoes.length === 0) {
        const nubank = new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' })
        const xp = new Cartao({ id: 'c2', nome: 'XP Visa', diaFechamento: 25, responsavelPadraoId: 'm2' })
        await cartaoRepo.salvar(nubank)
        await cartaoRepo.salvar(xp)
        todosCartoes = [nubank, xp]
      }
      cartoes.value = todosCartoes

      // Inicializar faturas abertas padrão caso não existam
      let todasFaturas = await faturaRepo.listarTodas()
      if (todasFaturas.length === 0) {
        const fatura1 = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
        const fatura2 = new Fatura({ id: 'f2', cartaoId: 'c2', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm2', status: 'ABERTA' })
        await faturaRepo.salvar(fatura1)
        await faturaRepo.salvar(fatura2)
        todasFaturas = [fatura1, fatura2]
      }
      faturas.value = todasFaturas

      // Carregar acertos e gastos
      const todosAcertos: AcertoMembro[] = []
      const todosGastos: Gasto[] = []
      for (const f of todasFaturas) {
        const porFaturaAcertos = await acertoRepo.buscarPorFatura(f.id)
        todosAcertos.push(...porFaturaAcertos)

        const porFaturaGastos = await gastoRepo.buscarPorFatura(f.id)
        todosGastos.push(...porFaturaGastos)
      }
      acertos.value = todosAcertos
      gastos.value = todosGastos
    }

    const fecharFaturaManual = async (faturaId: string) => {
      await faturaService.fecharFatura(faturaId, new Date())
      await inicializar()
    }

    const quitarAcertoMembro = async (acertoId: string) => {
      await acertoService.marcarPago(acertoId, new Date())
      await inicializar()
    }

    const faturasAbertas = computed(() => faturas.value.filter(f => f.status === 'ABERTA'))
    const faturasFechadas = computed(() => faturas.value.filter(f => f.status === 'FECHADA'))

    const calcularConsumoMembro = (faturaId: string, membroId: string) => {
      const gastosDaFatura = gastos.value.filter(g => g.faturaId === faturaId)
      let total = 0
      gastosDaFatura.forEach(g => {
        g.divisoes.forEach(d => {
          if (d.membroId === membroId) {
            total += d.valor.centavos
          }
        })
      })
      return total
    }

    return {
      cartoes,
      faturas,
      acertos,
      gastos,
      inicializar,
      fecharFaturaManual,
      quitarAcertoMembro,
      faturasAbertas,
      faturasFechadas,
      calcularConsumoMembro
    }
  }
  ```

- [ ] **Step 2: Fazer commit do progresso**
  ```bash
  git add src/modules/ledger/composables/useCartoesEFaturas.ts
  git commit -m "feat(composables): add useCartoesEFaturas reactive composable"
  ```

---

### Task 5: Redesenhar o Dashboard para Cartões & Faturas (DashboardSaldos)

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`
- Modify: `src/App.vue`
- Test: `src/components/ledger/DashboardSaldos.test.ts`

- [ ] **Step 1: Escrever teste que falha**
  Modificar `src/components/ledger/DashboardSaldos.test.ts` para testar os acertos de faturas e previsões de gastos.
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { mount } from '@vue/test-utils'
  import DashboardSaldos from './DashboardSaldos.vue'

  describe('DashboardSaldos - Cartões & Faturas', () => {
    it('deve exibir as faturas fechadas aguardando acerto', () => {
      const wrapper = mount(DashboardSaldos, {
        props: {
          membros: [{ id: 'm1', nome: 'João' }, { id: 'm2', nome: 'Maria' }],
          faturasFechadas: [{ id: 'f1', cartaoId: 'c1', responsavelId: 'm1', status: 'FECHADA', periodo: { mes: 5, ano: 2026 } }] as any,
          acertosPendentes: [{ id: 'a1', faturaId: 'f1', membroId: 'm2', valorAcerto: { centavos: 8000 }, tipo: 'MEMBRO_PAGA', pago: false }] as any,
          faturasAbertas: [] as any,
          cartoes: [{ id: 'c1', nome: 'Nubank' }] as any,
          calcularConsumo: () => 0
        }
      })

      expect(wrapper.text()).toContain('Faturas Fechadas')
      expect(wrapper.text()).toContain('Maria deve para João')
      expect(wrapper.text()).toContain('R$ 80,00')
    })
  })
  ```

- [ ] **Step 2: Executar teste e verificar falha**
  Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
  Expected: FAIL (Props incompatíveis / falta de propriedades)

- [ ] **Step 3: Modificar DashboardSaldos.vue**
  Modificar a UI para focar 100% no fluxo de faturas e acertos, conforme a Abordagem B (Seções Empilhadas):
  ```html
  <script setup lang="ts">
  import { computed } from 'vue'
  import { Dinheiro } from '../../shared/primitives/Dinheiro'
  import { Fatura } from '../../modules/ledger/core/domain/Fatura'
  import { AcertoMembro } from '../../modules/ledger/core/domain/AcertoMembro'
  import { Cartao } from '../../modules/ledger/core/domain/Cartao'

  interface Props {
    membros: { id: string; nome: string }[]
    faturasAbertas: Fatura[]
    faturasFechadas: Fatura[]
    acertosPendentes: AcertoMembro[]
    cartoes: Cartao[]
    calcularConsumo: (faturaId: string, membroId: string) => number
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['quitarAcerto', 'fecharFatura', 'novoGasto'])

  const getMembroNome = (id: string) => {
    return props.membros.find(m => m.id === id)?.nome || id
  }

  const getCartaoNome = (cartaoId: string) => {
    return props.cartoes.find(c => c.id === cartaoId)?.nome || 'Cartão'
  }

  const acertosDaFatura = (faturaId: string) => {
    return props.acertosPendentes.filter(a => a.faturaId === faturaId && !a.pago)
  }

  const formatarDinheiro = (centavos: number) => {
    return Dinheiro.deCentavos(centavos).centavos / 100
  }
  </script>

  <template>
    <div class="max-w-md mx-auto space-y-6">
      <!-- Seção 1: Faturas Fechadas (Acertos Ativos) -->
      <div v-if="faturasFechadas.length > 0" class="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
        <h3 class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-4">⚠️ Faturas Fechadas (Acertos Pendentes)</h3>
        
        <div v-for="fatura in faturasFechadas" :key="fatura.id" class="space-y-4 mb-4 last:mb-0">
          <div class="flex justify-between items-center border-b border-amber-200/50 pb-2">
            <span class="font-bold text-slate-800 text-sm">💳 {{ getCartaoNome(fatura.cartaoId) }} • {{ fatura.periodo.mes }}/{{ fatura.periodo.ano }}</span>
            <span class="text-xs text-amber-700 font-medium">Responsável: {{ getMembroNome(fatura.responsavelId) }}</span>
          </div>

          <div v-for="acerto in acertosDaFatura(fatura.id)" :key="acerto.id" class="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
            <div>
              <span class="font-bold text-slate-800 text-sm">{{ getMembroNome(acerto.membroId) }}</span>
              <span class="text-xs text-slate-500 block">deve para {{ getMembroNome(fatura.responsavelId) }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-red-600 font-extrabold">R$ {{ formatarDinheiro(acerto.valorAcerto.centavos).toFixed(2) }}</span>
              <button @click="emit('quitarAcerto', acerto.id)" class="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition-colors shadow-sm">Quitar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Seção 2: Faturas Abertas (Previsão de Gastos) -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">🔍 Faturas Abertas (Previsão de Gastos)</h3>
        
        <div v-for="fatura in faturasAbertas" :key="fatura.id" class="border-b border-slate-100 last:border-0 pb-4 mb-4 last:pb-0 last:mb-0">
          <div class="flex justify-between items-center mb-3">
            <span class="font-bold text-slate-800">💳 {{ getCartaoNome(fatura.cartaoId) }} • {{ fatura.periodo.mes }}/{{ fatura.periodo.ano }}</span>
            <button @click="emit('fecharFatura', fatura.id)" class="text-xs font-bold bg-slate-800 text-white px-3 py-1 rounded-lg hover:bg-slate-700 shadow-sm transition-colors">Fechar Fatura</button>
          </div>

          <div class="space-y-2">
            <div v-for="membro in membros" :key="membro.id" class="flex justify-between items-center text-sm">
              <span class="text-slate-600">{{ membro.nome }} <span v-if="membro.id === fatura.responsavelId" class="text-xs text-indigo-500 font-semibold">(Responsável)</span>:</span>
              <span class="font-semibold text-slate-800">R$ {{ formatarDinheiro(calcularConsumo(fatura.id, membro.id)).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  ```

- [ ] **Step 4: Modificar o arquivo App.vue**
  Integrar o `useCartoesEFaturas` e reestruturar a montagem de `DashboardSaldos` no `src/App.vue`:
  ```html
  <!-- Substituir as linhas reativas e a chamada de DashboardSaldos no App.vue -->
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import NovoLancamentoWizard from './components/ledger/NovoLancamentoWizard.vue'
  import DashboardSaldos from './components/ledger/DashboardSaldos.vue'
  import { useCartoesEFaturas } from './modules/ledger/composables/useCartoesEFaturas'
  import { useMembros } from './modules/ledger/composables/useMembros'
  import { Plus, X } from 'lucide-vue-next'

  const currentView = ref<'dashboard' | 'wizard'>('dashboard')
  const { ativos, membros: todosMembros, inicializar: inicializarMembros } = useMembros()
  const { 
    cartoes, 
    faturas, 
    acertos, 
    inicializar: inicializarCartoes, 
    fecharFaturaManual, 
    quitarAcertoMembro, 
    faturasAbertas, 
    faturasFechadas, 
    calcularConsumoMembro 
  } = useCartoesEFaturas()

  onMounted(async () => {
    await Promise.all([
      inicializarMembros(),
      inicializarCartoes()
    ])
  })
  </script>

  <template>
    <!-- Substituir DashboardSaldos no template -->
    <DashboardSaldos 
      :membros="todosMembros"
      :faturasAbertas="faturasAbertas"
      :faturasFechadas="faturasFechadas"
      :acertosPendentes="acertos"
      :cartoes="cartoes"
      :calcular-consumo="calcularConsumoMembro"
      @quitarAcerto="quitarAcertoMembro"
      @fecharFatura="fecharFaturaManual"
    />
  </template>
  ```

- [ ] **Step 5: Executar e verificar sucesso dos testes**
  Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
  Expected: PASS

- [ ] **Step 6: Fazer commit do progresso**
  ```bash
  git add src/components/ledger/DashboardSaldos* src/App.vue
  git commit -m "feat(ui): redesign dashboard layout for credit cards and invoices exclusively"
  ```

---

### Task 6: Integrar Gastos no Wizard de Lançamentos

**Files:**
- Modify: `src/modules/ledger/composables/useNovoLancamentoWizard.ts`
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Atualizar useNovoLancamentoWizard para persistir como Gasto**
  Modificar a ação de salvar do `useNovoLancamentoWizard.ts` para que, ao selecionar Cartão de Crédito, salve um `Gasto` associado à fatura correta:
  ```typescript
  import { ref, computed } from 'vue'
  import { Gasto } from '../core/domain/Gasto'
  import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'
  import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
  import { determinarPeriodoFatura } from '../core/domain/Fatura'
  import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
  import { LocalStorageFaturaRepository } from '../adapters/LocalStorageFaturaRepository'

  const gastoRepo = new LocalStorageGastoRepository()
  const faturaRepo = new LocalStorageFaturaRepository()

  // Dentro do composable useNovoLancamentoWizard:
  export function useNovoLancamentoWizard(membros: { id: string; nome: string }[]) {
    // Adicionar propriedade de cartao
    const cartaoSelecionadoId = ref<string>('c1')

    const finalizarComoGastoCartao = async () => {
      const total = Dinheiro.deReais(valor.value)
      const partes = total.distribuir(beneficiarios_selecionados.value.length)
      const divisoes = beneficiarios_selecionados.value.map((membroId, index) => new DivisaoDeGasto(membroId, partes[index]))

      const todasFaturas = await faturaRepo.listarTodas()
      const fatura = todasFaturas.find(f => f.cartaoId === cartaoSelecionadoId.value && f.status === 'ABERTA') 
        || todasFaturas[0]

      const novoGasto = new Gasto({
        id: crypto.randomUUID(),
        faturaId: fatura.id,
        descricao: descricao.value,
        valorTotal: total,
        divisoes
      })

      await gastoRepo.salvar(novoGasto)
      reset()
    }
  }
  ```

- [ ] **Step 2: Modificar NovoLancamentoWizard.vue para suportar Cartão**
  Adicionar a opção de Cartão no Wizard de despesa, permitindo selecionar o Cartão de Crédito de destino:
  ```html
  <!-- Modificar o Passo 3 do NovoLancamentoWizard.vue para permitir selecionar o cartão e dispensar pagadores manuais -->
  ```

- [ ] **Step 3: Verificar sucesso de todos os testes do projeto**
  Run: `npx vitest run`
  Expected: PASS (100% de sucesso nos testes unitários e integrados)

- [ ] **Step 4: Fazer commit do progresso e limpar**
  ```bash
  git add src/modules/ledger/composables/useNovoLancamentoWizard.ts src/components/ledger/NovoLancamentoWizard.vue
  git commit -m "feat(ui): support registering card spending in wizard"
  ```
