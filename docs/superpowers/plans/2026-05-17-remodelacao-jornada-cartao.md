# Remodelação da Jornada do Cartão de Crédito Coletivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplificar a jornada de uso do cartão de crédito separando o momento do cadastro de gastos da divisão e acerto final que acontecem após o fechamento da fatura.

**Architecture:** Atualização das entidades de domínio Gasto e AcertoMembro para rastrear comprador e pagamentos parciais; adequação das camadas de persistência local para resiliência de dados legados; separação lógica no FaturaService em fechamento e confirmação de acertos, e remodelagem de UI com novos passos do wizard e painel interativo de revisão e reembolso.

**Tech Stack:** Vue 3, TypeScript, Vitest, LocalStorage.

---

### Task 1: domain/Gasto

**Files:**
- Modify: `src/modules/ledger/core/domain/Gasto.ts`
- Test: `src/modules/ledger/core/domain/Gasto.test.ts`

- [ ] **Step 1: Write the failing test**
  Modify `src/modules/ledger/core/domain/Gasto.test.ts` to expect `compradorId` inside `GastoProps` and in the instantiated class:
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { Gasto } from './Gasto'
  import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
  import { DivisaoDeGasto } from './DivisaoDeGasto'

  describe('Gasto', () => {
    it('deve criar um gasto com compradorId e divisoes validas', () => {
      const total = Dinheiro.deCentavos(10000)
      const divisoes = [new DivisaoDeGasto('m1', Dinheiro.deCentavos(10000))]
      const gasto = new Gasto({
        id: 'g1',
        faturaId: 'f1',
        descricao: 'Mercado',
        valorTotal: total,
        compradorId: 'm1', // <- NOVO
        divisoes
      })
      expect(gasto.compradorId).toBe('m1')
      expect(gasto.valorTotal.centavos).toBe(10000)
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/modules/ledger/core/domain/Gasto.test.ts`
  Expected: FAIL (compilation error due to missing `compradorId` in type and class)

- [ ] **Step 3: Write minimal implementation**
  Modify `src/modules/ledger/core/domain/Gasto.ts` to declare and set `compradorId`:
  ```typescript
  import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
  import { DivisaoDeGasto } from './DivisaoDeGasto'

  export interface GastoProps {
    id: string
    faturaId: string
    descricao: string
    valorTotal: Dinheiro
    compradorId: string // <- NOVO
    divisoes: ReadonlyArray<DivisaoDeGasto>
  }

  export class Gasto {
    public readonly id: string
    public readonly faturaId: string
    public readonly descricao: string
    public readonly valorTotal: Dinheiro
    public readonly compradorId: string // <- NOVO
    public readonly divisoes: ReadonlyArray<DivisaoDeGasto>

    constructor(props: GastoProps) {
      if (props.divisoes.length === 0) {
        throw new Error('Um gasto deve ter pelo menos uma divisão')
      }

      const soma = props.divisoes.reduce((acc, d) => acc.somar(d.valor), Dinheiro.deCentavos(0))
      if (!soma.equals(props.valorTotal)) {
        throw new Error('A soma das divisões deve ser igual ao valor total do gasto')
      }

      this.id = props.id
      this.faturaId = props.faturaId
      this.descricao = props.descricao
      this.valorTotal = props.valorTotal
      this.compradorId = props.compradorId // <- NOVO
      this.divisoes = props.divisoes
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/modules/ledger/core/domain/Gasto.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/modules/ledger/core/domain/Gasto.ts src/modules/ledger/core/domain/Gasto.test.ts
  git commit -m "feat(domain): add compradorId to Gasto entity"
  ```

---

### Task 2: domain/AcertoMembro

**Files:**
- Modify: `src/modules/ledger/core/domain/AcertoMembro.ts`
- Test: `src/modules/ledger/core/domain/AcertoMembro.test.ts`

- [ ] **Step 1: Write the failing test**
  Modify `src/modules/ledger/core/domain/AcertoMembro.test.ts` to test amortized `valorPago` and `registrarReembolso()` partial payments instead of the direct boolean `marcarComoPago`:
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { AcertoMembro } from './AcertoMembro'
  import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

  describe('AcertoMembro', () => {
    it('deve registrar reembolso parcial e quitar quando atingir valor total', () => {
      const acerto = new AcertoMembro({
        id: 'ac1',
        faturaId: 'f1',
        membroId: 'm1',
        totalConsumido: Dinheiro.deCentavos(10000),
        totalAntecipado: Dinheiro.deCentavos(2000)
      }) // Valor acerto = 8000
      expect(acerto.pago).toBe(false)
      expect(acerto.valorPago.centavos).toBe(0)

      acerto.registrarReembolso(Dinheiro.deCentavos(5000), new Date('2026-05-18T10:00:00Z'))
      expect(acerto.pago).toBe(false)
      expect(acerto.valorPago.centavos).toBe(5000)

      acerto.registrarReembolso(Dinheiro.deCentavos(3000), new Date('2026-05-19T10:00:00Z'))
      expect(acerto.pago).toBe(true)
      expect(acerto.valorPago.centavos).toBe(8000)
      expect(acerto.dataPagamento).toEqual(new Date('2026-05-19T10:00:00Z'))
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/modules/ledger/core/domain/AcertoMembro.test.ts`
  Expected: FAIL (compilation error due to missing `valorPago` and `registrarReembolso`)

- [ ] **Step 3: Write minimal implementation**
  Modify `src/modules/ledger/core/domain/AcertoMembro.ts` to replace/augment the logic with `valorPago` and `registrarReembolso`:
  ```typescript
  import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

  export type TipoAcerto = 'MEMBRO_PAGA' | 'RESPONSAVEL_PAGA'

  export interface AcertoMembroProps {
    id: string
    faturaId: string
    membroId: string
    totalConsumido: Dinheiro
    totalAntecipado: Dinheiro
    valorPago?: Dinheiro // <- NOVO
    pago?: boolean
    dataPagamento?: Date
  }

  export class AcertoMembro {
    public readonly id: string
    public readonly faturaId: string
    public readonly membroId: string
    public readonly totalConsumido: Dinheiro
    public readonly totalAntecipado: Dinheiro
    public readonly valorAcerto: Dinheiro
    public readonly tipo: TipoAcerto
    public valorPago: Dinheiro // <- NOVO
    public pago: boolean
    public dataPagamento?: Date

    constructor(props: AcertoMembroProps) {
      this.id = props.id
      this.faturaId = props.faturaId
      this.membroId = props.membroId
      this.totalConsumido = props.totalConsumido
      this.totalAntecipado = props.totalAntecipado
      this.valorPago = props.valorPago ?? Dinheiro.deCentavos(0) // <- NOVO

      const diff = props.totalConsumido.centavos - props.totalAntecipado.centavos
      this.valorAcerto = Dinheiro.deCentavos(Math.abs(diff))
      this.tipo = diff >= 0 ? 'MEMBRO_PAGA' : 'RESPONSAVEL_PAGA'
      this.pago = props.pago ?? (this.valorPago.centavos >= this.valorAcerto.centavos)
      this.dataPagamento = props.dataPagamento
    }

    public registrarReembolso(valor: Dinheiro, data: Date = new Date()): void {
      if (valor.centavos <= 0) {
        throw new Error('Valor do reembolso deve ser maior que zero')
      }
      const novoTotalPago = this.valorPago.somar(valor)
      if (novoTotalPago.centavos > this.valorAcerto.centavos) {
        throw new Error('Valor do reembolso excede a dívida total do acerto')
      }
      this.valorPago = novoTotalPago
      if (this.valorPago.centavos >= this.valorAcerto.centavos) {
        this.pago = true
        this.dataPagamento = data
      }
    }

    // Mantido para retrocompatibilidade caso outros serviços utilizem
    public marcarComoPago(data: Date): void {
      const faltaPagar = Dinheiro.deCentavos(this.valorAcerto.centavos - this.valorPago.centavos)
      if (faltaPagar.centavos > 0) {
        this.registrarReembolso(faltaPagar, data)
      }
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/modules/ledger/core/domain/AcertoMembro.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/modules/ledger/core/domain/AcertoMembro.ts src/modules/ledger/core/domain/AcertoMembro.test.ts
  git commit -m "feat(domain): add support for partial settlements in AcertoMembro"
  ```

---

### Task 3: LocalStorageGastoRepository

**Files:**
- Modify: `src/modules/ledger/adapters/LocalStorageGastoRepository.ts`
- Create: `src/modules/ledger/adapters/LocalStorageGastoRepository.test.ts`

- [ ] **Step 1: Write the failing test**
  Create `src/modules/ledger/adapters/LocalStorageGastoRepository.test.ts` to test saving, fetching, and backwards compatibility (fallback of missing `compradorId`):
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest'
  import { LocalStorageGastoRepository } from './LocalStorageGastoRepository'
  import { Gasto } from '../core/domain/Gasto'
  import { Dinheiro } from '../../../shared/primitives/Dinheiro'
  import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'

  describe('LocalStorageGastoRepository', () => {
    let repo: LocalStorageGastoRepository

    beforeEach(() => {
      localStorage.clear()
      repo = new LocalStorageGastoRepository()
    })

    it('deve salvar e buscar um gasto gravando compradorId', async () => {
      const total = Dinheiro.deCentavos(5000)
      const divisoes = [new DivisaoDeGasto('m1', Dinheiro.deCentavos(5000))]
      const gasto = new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'Carrefour', valorTotal: total, compradorId: 'm1', divisoes })

      await repo.salvar(gasto)
      const list = await repo.buscarPorFatura('f1')

      expect(list.length).toBe(1)
      expect(list[0].compradorId).toBe('m1')
    })

    it('deve tolerar gastos legados sem compradorId e inferir com base no primeiro membro da divisao', async () => {
      // Grava diretamente dado legado no localStorage
      const legado = [{
        id: 'g_legacy',
        faturaId: 'f_legacy',
        descricao: 'Legacy',
        valorTotalCentavos: 3000,
        divisoes: [{ membroId: 'm_legacy', centavos: 3000 }]
      }]
      localStorage.setItem('divi_gastos_cartao', JSON.stringify(legado))

      const list = await repo.buscarPorFatura('f_legacy')
      expect(list.length).toBe(1)
      expect(list[0].compradorId).toBe('m_legacy')
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/modules/ledger/adapters/LocalStorageGastoRepository.test.ts`
  Expected: FAIL (compilation error due to missing `compradorId` serialization in the repository)

- [ ] **Step 3: Write minimal implementation**
  Modify `src/modules/ledger/adapters/LocalStorageGastoRepository.ts` to add compradorId handling and backwards-compatibility:
  ```typescript
  import type { IGastoRepository } from '../core/ports/IGastoRepository'
  import { Gasto } from '../core/domain/Gasto'
  import { Dinheiro } from '../../../shared/primitives/Dinheiro'
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
          compradorId: g.compradorId, // <- NOVO
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
        return raw.map(g => {
          const divisoes = g.divisoes.map((d: any) => new DivisaoDeGasto(d.membroId, Dinheiro.deCentavos(d.centavos)))
          
          // Retrocompatibilidade: Se compradorId não existir, pega o primeiro das divisões
          const compradorId = g.compradorId || divisoes[0]?.membroId || 'membro_padrao'

          return new Gasto({
            id: g.id,
            faturaId: g.faturaId,
            descricao: g.descricao,
            valorTotal: Dinheiro.deCentavos(g.valorTotalCentavos),
            compradorId, // <- NOVO
            divisoes
          })
        })
      } catch (e) {
        console.error(e)
        return []
      }
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/modules/ledger/adapters/LocalStorageGastoRepository.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/modules/ledger/adapters/LocalStorageGastoRepository.ts src/modules/ledger/adapters/LocalStorageGastoRepository.test.ts
  git commit -m "feat(persistence): support compradorId serialization in LocalStorageGastoRepository"
  ```

---

### Task 4: LocalStorageAcertoMembroRepository

**Files:**
- Modify: `src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.ts`
- Modify: `src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.test.ts`

- [ ] **Step 1: Write the failing test**
  Modify `src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.test.ts` to test `valorPagoCentavos` serialization and legacy `pago` fallback:
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest'
  import { LocalStorageAcertoMembroRepository } from './LocalStorageAcertoMembroRepository'
  import { AcertoMembro } from '../core/domain/AcertoMembro'
  import { Dinheiro } from '../../../shared/primitives/Dinheiro'

  describe('LocalStorageAcertoMembroRepository', () => {
    let repo: LocalStorageAcertoMembroRepository

    beforeEach(() => {
      localStorage.clear()
      repo = new LocalStorageAcertoMembroRepository()
    })

    it('deve salvar e buscar um acerto com valorPagoCentavos', async () => {
      const acerto = new AcertoMembro({
        id: 'ac1',
        faturaId: 'f1',
        membroId: 'm1',
        totalConsumido: Dinheiro.deCentavos(10000),
        totalAntecipado: Dinheiro.deCentavos(2000),
        valorPago: Dinheiro.deCentavos(3000)
      })

      await repo.salvar(acerto)
      const recovered = await repo.buscarPorId('ac1')

      expect(recovered).not.toBeNull()
      expect(recovered!.valorPago.centavos).toBe(3000)
      expect(recovered!.pago).toBe(false)
    })

    it('deve inferir valorPagoCentavos a partir do pago legado se nao houver campo', async () => {
      const legado = [{
        id: 'ac_legacy',
        faturaId: 'f1',
        membroId: 'm1',
        totalConsumidoCentavos: 10000,
        totalAntecipadoCentavos: 2000,
        pago: true
      }]
      localStorage.setItem('divi_acertos_membro', JSON.stringify(legado))

      const recovered = await repo.buscarPorId('ac_legacy')
      expect(recovered).not.toBeNull()
      expect(recovered!.valorPago.centavos).toBe(8000) // valorAcerto total
      expect(recovered!.pago).toBe(true)
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.test.ts`
  Expected: FAIL (compilation error due to missing/incorrect serializations)

- [ ] **Step 3: Write minimal implementation**
  Modify `src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.ts` to serialize/deserialize `valorPagoCentavos` and add retrocompatibilidade fallback:
  ```typescript
  import type { IAcertoMembroRepository } from '../core/ports/IAcertoMembroRepository'
  import { AcertoMembro } from '../core/domain/AcertoMembro'
  import { Dinheiro } from '../../../shared/primitives/Dinheiro'
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
          valorPagoCentavos: a.valorPago.centavos, // <- NOVO
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

    async excluirPorFatura(faturaId: string): Promise<void> {
      await StorageLock.executarAtomico('lock_divi_acertos_membro', async () => {
        const todos = await this.listarTodos()
        const filtrados = todos.filter(a => a.faturaId !== faturaId)
        const dtos = filtrados.map(a => ({
          id: a.id,
          faturaId: a.faturaId,
          membroId: a.membroId,
          totalConsumidoCentavos: a.totalConsumido.centavos,
          totalAntecipadoCentavos: a.totalAntecipado.centavos,
          valorPagoCentavos: a.valorPago.centavos, // <- NOVO
          pago: a.pago,
          dataPagamento: a.dataPagamento ? a.dataPagamento.toISOString() : undefined
        }))
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
      })
    }

    private async listarTodos(): Promise<AcertoMembro[]> {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return []
      try {
        const raw = JSON.parse(data) as any[]
        return raw.map(a => {
          const totalConsumido = Dinheiro.deCentavos(a.totalConsumidoCentavos)
          const totalAntecipado = Dinheiro.deCentavos(a.totalAntecipadoCentavos)
          
          const diff = totalConsumido.centavos - totalAntecipado.centavos
          const valorAcerto = Dinheiro.deCentavos(Math.abs(diff))
          
          // Retrocompatibilidade: Se valorPagoCentavos não existe, infere pelo status pago
          const valorPago = a.valorPagoCentavos !== undefined
            ? Dinheiro.deCentavos(a.valorPagoCentavos)
            : (a.pago ? valorAcerto : Dinheiro.deCentavos(0))

          return new AcertoMembro({
            id: a.id,
            faturaId: a.faturaId,
            membroId: a.membroId,
            totalConsumido,
            totalAntecipado,
            valorPago, // <- NOVO
            pago: a.pago,
            dataPagamento: a.dataPagamento ? new Date(a.dataPagamento) : undefined
          })
        })
      } catch (e) {
        console.error(e)
        return []
      }
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.ts src/modules/ledger/adapters/LocalStorageAcertoMembroRepository.test.ts
  git commit -m "feat(persistence): serialize valorPagoCentavos in LocalStorageAcertoMembroRepository"
  ```

---

### Task 5: services/FaturaService

**Files:**
- Modify: `src/modules/ledger/core/services/FaturaService.ts`
- Modify: `src/modules/ledger/core/services/FaturaService.test.ts`

- [ ] **Step 1: Write the failing test**
  Modify `src/modules/ledger/core/services/FaturaService.test.ts` to test separating `fecharFatura()` (marks FECHADA but does not generate acertos) and `confirmarAcertos()` (calculates final balances and persists `AcertoMembro`):
  ```typescript
  import { describe, it, expect, vi } from 'vitest'
  import { FaturaService } from './FaturaService'
  import { Fatura } from '../domain/Fatura'
  import { Gasto } from '../domain/Gasto'
  import { DivisaoDeGasto } from '../domain/DivisaoDeGasto'
  import { Antecipacao } from '../domain/Antecipacao'
  import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

  describe('FaturaService', () => {
    it('deve fechar a fatura sem gerar acertos', async () => {
      const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })

      const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
      const gastoRepo = { buscarPorFatura: vi.fn() }
      const antRepo = { buscarPorFatura: vi.fn() }
      const acertoRepo = { excluirPorFatura: vi.fn(), salvar: vi.fn() }

      const service = new FaturaService(faturaRepo as any, gastoRepo as any, antRepo as any, acertoRepo as any)
      await service.fecharFatura('f1', new Date())

      expect(fatura.status).toBe('FECHADA')
      expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
      expect(acertoRepo.salvar).not.toHaveBeenCalled()
    })

    it('deve consolidar os gastos finais e gerar acertos ao confirmar acertos', async () => {
      const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
      const gastos = [
        new Gasto({
          id: 'g1',
          faturaId: 'f1',
          descricao: 'Mercado',
          valorTotal: Dinheiro.deCentavos(20000),
          compradorId: 'm2',
          divisoes: [new DivisaoDeGasto('m2', Dinheiro.deCentavos(10000)), new DivisaoDeGasto('m3', Dinheiro.deCentavos(10000))]
        })
      ]
      const antecipacoes = [
        new Antecipacao({ id: 'a1', faturaId: 'f1', membroId: 'm2', valor: Dinheiro.deCentavos(3000), data: new Date() })
      ]

      const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
      const gastoRepo = { buscarPorFatura: vi.fn().mockResolvedValue(gastos) }
      const antRepo = { buscarPorFatura: vi.fn().mockResolvedValue(antecipacoes) }
      const acertoRepo = { excluirPorFatura: vi.fn(), salvar: vi.fn() }

      const service = new FaturaService(faturaRepo as any, gastoRepo as any, antRepo as any, acertoRepo as any)
      await service.confirmarAcertos('f1')

      // m2 consumo=10000, ant=3000 -> deve pagar 7000
      // m3 consumo=10000, ant=0 -> deve pagar 10000
      // m1 (dono/responsavel) é excluído
      expect(acertoRepo.excluirPorFatura).toHaveBeenCalledWith('f1')
      expect(acertoRepo.salvar).toHaveBeenCalledTimes(2)

      const acertosSalvos = acertoRepo.salvar.mock.calls.map(c => c[0])
      const acertoM2 = acertosSalvos.find(a => a.membroId === 'm2')
      const acertoM3 = acertosSalvos.find(a => a.membroId === 'm3')

      expect(acertoM2).toBeDefined()
      expect(acertoM2.valorAcerto.centavos).toBe(7000)
      expect(acertoM2.tipo).toBe('MEMBRO_PAGA')

      expect(acertoM3).toBeDefined()
      expect(acertoM3.valorAcerto.centavos).toBe(10000)
      expect(acertoM3.tipo).toBe('MEMBRO_PAGA')
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/modules/ledger/core/services/FaturaService.test.ts`
  Expected: FAIL (compilation and behavior mismatches)

- [ ] **Step 3: Write minimal implementation**
  Modify `src/modules/ledger/core/services/FaturaService.ts` to separate the two states, implement `confirmarAcertos`, and remove acerto generation from `fecharFatura`:
  ```typescript
  import { Fatura } from '../domain/Fatura'
  import { AcertoMembro } from '../domain/AcertoMembro'
  import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
  import type { IFaturaRepository } from '../ports/IFaturaRepository'
  import type { IGastoRepository } from '../ports/IGastoRepository'
  import type { IAntecipacaoRepository } from '../ports/IAntecipacaoRepository'
  import type { IAcertoMembroRepository } from '../ports/IAcertoMembroRepository'

  export class FaturaService {
    constructor(
      private faturaRepo: IFaturaRepository,
      private gastoRepo: IGastoRepository,
      private antecipacaoRepo: IAntecipacaoRepository,
      private acertoRepo: IAcertoMembroRepository
    ) {}

    async fecharFatura(faturaId: string, dataPagamentoBanco: Date): Promise<void> {
      const fatura = await this.faturaRepo.buscarPorId(faturaId)
      if (!fatura) throw new Error('Fatura não encontrada')

      fatura.fechar(dataPagamentoBanco)
      await this.faturaRepo.salvar(fatura)
    }

    async confirmarAcertos(faturaId: string): Promise<void> {
      const fatura = await this.faturaRepo.buscarPorId(faturaId)
      if (!fatura) throw new Error('Fatura não encontrada')
      if (fatura.status !== 'FECHADA') {
        throw new Error('Apenas faturas FECHADAS podem ter acertos confirmados')
      }

      const gastos = await this.gastoRepo.buscarPorFatura(faturaId)
      const antecipacoes = await this.antecipacaoRepo.buscarPorFatura(faturaId)

      const consumoMap = new Map<string, number>()
      gastos.forEach(g => {
        g.divisoes.forEach(d => {
          consumoMap.set(d.membroId, (consumoMap.get(d.membroId) || 0) + d.valor.centavos)
        })
      })

      const antMap = new Map<string, number>()
      antecipacoes.forEach(a => {
        antMap.set(a.membroId, (antMap.get(a.membroId) || 0) + a.valor.centavos)
      })

      const membrosIds = new Set([...consumoMap.keys(), ...antMap.keys()])
      membrosIds.delete(fatura.responsavelId) // Dono não gera acertos para si

      await this.acertoRepo.excluirPorFatura(faturaId)

      for (const membroId of membrosIds) {
        const consumo = Dinheiro.deCentavos(consumoMap.get(membroId) || 0)
        const antecipado = Dinheiro.deCentavos(antMap.get(membroId) || 0)

        const acerto = new AcertoMembro({
          id: crypto.randomUUID(),
          faturaId: fatura.id,
          membroId,
          totalConsumido: consumo,
          totalAntecipado: antecipado
        })

        await this.acertoRepo.salvar(acerto)
      }
    }

    async reabrirFatura(faturaId: string): Promise<void> {
      const fatura = await this.faturaRepo.buscarPorId(faturaId)
      if (!fatura) throw new Error('Fatura não encontrada')

      fatura.reabrir()
      await this.faturaRepo.salvar(fatura)
      await this.acertoRepo.excluirPorFatura(faturaId)
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/modules/ledger/core/services/FaturaService.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/modules/ledger/core/services/FaturaService.ts src/modules/ledger/core/services/FaturaService.test.ts
  git commit -m "feat(services): decouple statement closing from member settlement calculations"
  ```

---

### Task 6: services/AcertoService

**Files:**
- Modify: `src/modules/ledger/core/services/AcertoService.ts`
- Modify: `src/modules/ledger/core/services/AcertoService.test.ts`

- [ ] **Step 1: Write the failing test**
  Modify `src/modules/ledger/core/services/AcertoService.test.ts` to test the new `registrarReembolsoMembro` method (which supports partial payments and closes the fatura when fully settled):
  ```typescript
  import { describe, it, expect, vi } from 'vitest'
  import { AcertoService } from './AcertoService'
  import { AcertoMembro } from '../domain/AcertoMembro'
  import { Fatura } from '../domain/Fatura'
  import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

  describe('AcertoService', () => {
    it('deve registrar reembolso parcial e marcar fatura acertada quando zerar a divida', async () => {
      const acerto = new AcertoMembro({
        id: 'ac1',
        faturaId: 'f1',
        membroId: 'm1',
        totalConsumido: Dinheiro.deCentavos(10000),
        totalAntecipado: Dinheiro.deCentavos(2000)
      }) // valorAcerto = 8000
      const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm2', status: 'FECHADA' })

      const acertoRepo = {
        buscarPorId: vi.fn().mockResolvedValue(acerto),
        buscarPorFatura: vi.fn().mockResolvedValue([acerto]),
        salvar: vi.fn()
      }
      const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }

      const service = new AcertoService(acertoRepo as any, faturaRepo as any)

      // Amortiza parcial
      await service.registrarReembolsoMembro('ac1', Dinheiro.deCentavos(5000))
      expect(acerto.pago).toBe(false)
      expect(acerto.valorPago.centavos).toBe(5000)
      expect(fatura.status).toBe('FECHADA')

      // Quita restante
      await service.registrarReembolsoMembro('ac1', Dinheiro.deCentavos(3000))
      expect(acerto.pago).toBe(true)
      expect(fatura.status).toBe('ACERTADA')
      expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/modules/ledger/core/services/AcertoService.test.ts`
  Expected: FAIL (compilation errors / method missing)

- [ ] **Step 3: Write minimal implementation**
  Modify `src/modules/ledger/core/services/AcertoService.ts` to implement `registrarReembolsoMembro` and update `quitarAcertoMembro`:
  ```typescript
  import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
  import type { IAcertoMembroRepository } from '../ports/IAcertoMembroRepository'
  import type { IFaturaRepository } from '../ports/IFaturaRepository'

  export class AcertoService {
    constructor(
      private acertoRepo: IAcertoMembroRepository,
      private faturaRepo: IFaturaRepository
    ) {}

    async registrarReembolsoMembro(acertoId: string, valor: Dinheiro, data: Date = new Date()): Promise<void> {
      const acerto = await this.acertoRepo.buscarPorId(acertoId)
      if (!acerto) throw new Error('Acerto não encontrado')

      acerto.registrarReembolso(valor, data)
      await this.acertoRepo.salvar(acerto)

      const acertos = await this.acertoRepo.buscarPorFatura(acerto.faturaId)
      const todosQuitados = acertos.every(a => a.pago)

      if (todosQuitados) {
        const fatura = await this.faturaRepo.buscarPorId(acerto.faturaId)
        if (fatura && fatura.status === 'FECHADA') {
          fatura.marcarAcertada()
          await this.faturaRepo.salvar(fatura)
        }
      }
    }

    // Retrocompatibilidade
    async quitarAcertoMembro(acertoId: string, dataPagamento: Date = new Date()): Promise<void> {
      const acerto = await this.acertoRepo.buscarPorId(acertoId)
      if (!acerto) throw new Error('Acerto não encontrado')

      const faltaPagar = Dinheiro.deCentavos(acerto.valorAcerto.centavos - acerto.valorPago.centavos)
      if (faltaPagar.centavos > 0) {
        await this.registrarReembolsoMembro(acertoId, faltaPagar, dataPagamento)
      }
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/modules/ledger/core/services/AcertoService.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/modules/ledger/core/services/AcertoService.ts src/modules/ledger/core/services/AcertoService.test.ts
  git commit -m "feat(services): implement partial member reimbursements in AcertoService"
  ```

---

### Task 7: Composables Updates

**Files:**
- Modify: `src/modules/ledger/composables/useNovoLancamentoWizard.ts`
- Modify: `src/modules/ledger/composables/useCartoesEFaturas.ts`
- Test: `src/modules/ledger/composables/useNovoLancamentoWizard.test.ts`
- Test: `src/modules/ledger/composables/useCartoesEFaturas.test.ts`

- [ ] **Step 1: Write the failing tests**
  Modify tests to adapt for compradorId in the wizard and expose the new action methods:
  
  In `src/modules/ledger/composables/useNovoLancamentoWizard.test.ts`:
  Change multi-selection beneficiary test to test single compradorId selection:
  ```typescript
  // Altere a atribuição no teste do wizard para:
  wizard.compradorSelecionadoId.value = 'm1'
  ```

  In `src/modules/ledger/composables/useCartoesEFaturas.test.ts`:
  Verify new methods are exposed (e.g., `confirmarAcertosFatura`, `registrarReembolsoParcial`, `atualizarGastoDivisoes`).

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/modules/ledger/composables/useNovoLancamentoWizard.test.ts`
  Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
  Modify the two composables.
  
  In `src/modules/ledger/composables/useNovoLancamentoWizard.ts`:
  Replace `beneficiariosSelecionadosIds` with `compradorSelecionadoId` and simplify `finalizarComoGastoCartao`:
  ```typescript
  // Substitua beneficiariosSelecionadosIds por compradorSelecionadoId
  const compradorSelecionadoId = ref('')

  // No finalizarComoGastoCartao:
  const finalizarComoGastoCartao = async () => {
    if (!cartaoSelecionadoId.value) throw new Error('Selecione um cartão')
    if (!compradorSelecionadoId.value) throw new Error('Selecione quem usou')
    if (!valor.value || isNaN(Number(valor.value))) throw new Error('Valor inválido')
    
    const total = Dinheiro.deReais(Number(valor.value))
    const divisoes = [new DivisaoDeGasto(compradorSelecionadoId.value, total)] // 100% comprador

    const todasFaturas = await faturaRepo.listarTodas()
    const fatura = todasFaturas.find(f => f.cartaoId === cartaoSelecionadoId.value && f.status === 'ABERTA')
      || todasFaturas[0]

    if (!fatura) throw new Error('Nenhuma fatura aberta encontrada para este cartão')

    const novoGasto = new Gasto({
      id: crypto.randomUUID(),
      faturaId: fatura.id,
      descricao: descricao.value,
      valorTotal: total,
      compradorId: compradorSelecionadoId.value,
      divisoes
    })

    await gastoRepo.salvar(novoGasto)
    reset()
  }
  ```

  In `src/modules/ledger/composables/useCartoesEFaturas.ts`:
  Add and export the three new methods:
  ```typescript
  const confirmarAcertosFatura = async (faturaId: string) => {
    await faturaService.confirmarAcertos(faturaId)
    await inicializar()
  }

  const registrarReembolsoParcial = async (acertoId: string, valor: Dinheiro) => {
    await acertoService.registrarReembolsoMembro(acertoId, valor, new Date())
    await inicializar()
  }

  const atualizarGastoDivisoes = async (gastoId: string, divisoes: DivisaoDeGasto[]) => {
    const listGastos = gastos.value
    const idx = listGastos.findIndex(g => g.id === gastoId)
    if (idx < 0) return

    const original = listGastos[idx]
    const novoGasto = new Gasto({
      id: original.id,
      faturaId: original.faturaId,
      descricao: original.descricao,
      valorTotal: original.valorTotal,
      compradorId: original.compradorId,
      divisoes
    })

    await gastoRepo.salvar(novoGasto)
    await inicializar()
  }

  // Exporte esses métodos no objeto de retorno do composable
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/modules/ledger/composables/useNovoLancamentoWizard.test.ts src/modules/ledger/composables/useCartoesEFaturas.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/modules/ledger/composables/useNovoLancamentoWizard.ts src/modules/ledger/composables/useCartoesEFaturas.ts
  git commit -m "feat(composables): integrate simplified wizard and new fatura/acerto actions"
  ```

---

### Task 8: UI Components Updates

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`
- Modify: `src/components/ledger/DashboardSaldos.vue`
- Test: Manual UI validation

- [ ] **Step 1: Write the failing tests**
  Modify component tests in `src/components/ledger/NovoLancamentoWizard.test.ts` and `src/components/ledger/DashboardSaldos.test.ts` to expect comprador selector and new buttons, or adjust mocks if failing due to missing refs.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/components/ledger/NovoLancamentoWizard.test.ts src/components/ledger/DashboardSaldos.test.ts`
  Expected: FAIL (compilation/template issues)

- [ ] **Step 3: Write minimal implementation**
  
  In `src/components/ledger/NovoLancamentoWizard.vue`:
  * Change Step 3 and 4: Step 3 is "Quem comprou?" (selection of 1 avatar of member). Step 4 is "Qual o valor e descrição?".
  * Bind avatar click to `compradorSelecionadoId.value = membro.id`.
  
  In `src/components/ledger/DashboardSaldos.vue`:
  * Implement the three states of Fatura:
    1. ABERTA: Shows list and button "Fechar Fatura" (opens a dialog/popover for date and confirms).
    2. FECHADA (Revisão): Shows extrato, allows changing `compradorId` or clicking "Dividir" (opens a modal with Division equal, custom value, custom %). Recalculates dynamically. Includes a primary button "🔒 Confirmar Divisão e Acertos" calling `confirmarAcertosFatura`.
    3. FECHADA (Acertos Ativos): Shows member debts. A button "Registrar Pix" prompts for value and calls `registrarReembolsoParcial`. Shows progress bar/paid amount. Button "Reabrir Fatura" returns it to aberta.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/components/ledger/NovoLancamentoWizard.test.ts src/components/ledger/DashboardSaldos.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/ledger/NovoLancamentoWizard.vue src/components/ledger/DashboardSaldos.vue
  git commit -m "feat(ui): implement simplified credit card wizard and statement closing review dashboard"
  ```
