# Ciclos de Gasto e Pagamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the separation of spend and payment cycles by introducing Cartão, Fatura, Gasto, Antecipação, e AcertoMembro.

**Architecture:** Domain-Driven Design (DDD) with rich entities, pure domain validations, interface-based repository ports, and orchestrating services (FaturaService, AcertoService) for the lifecycle transitions.

**Tech Stack:** TypeScript, Vitest.

---

### Task 1: Entidades Básicas (Cartão, DivisaoDeGasto e Gasto)

**Files:**
- Create: `src/modules/ledger/core/domain/Cartao.ts`
- Create: `src/modules/ledger/core/domain/Cartao.test.ts`
- Create: `src/modules/ledger/core/domain/DivisaoDeGasto.ts`
- Create: `src/modules/ledger/core/domain/Gasto.ts`
- Create: `src/modules/ledger/core/domain/Gasto.test.ts`

- [ ] **Step 1: Write failing tests for Cartao and Gasto**

```typescript
// src/modules/ledger/core/domain/Cartao.test.ts
import { describe, it, expect } from 'vitest'
import { Cartao } from './Cartao'

describe('Cartao', () => {
  it('deve criar um cartao valido', () => {
    const cartao = new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' })
    expect(cartao.id).toBe('c1')
    expect(cartao.diaFechamento).toBe(10)
  })
  
  it('deve rejeitar dia de fechamento invalido', () => {
    expect(() => new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 32, responsavelPadraoId: 'm1' }))
      .toThrow('Dia de fechamento deve ser entre 1 e 28')
  })
})
```

```typescript
// src/modules/ledger/core/domain/Gasto.test.ts
import { describe, it, expect } from 'vitest'
import { Gasto } from './Gasto'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from './DivisaoDeGasto'

describe('Gasto', () => {
  it('deve criar um gasto com divisoes validas', () => {
    const total = Dinheiro.deCentavos(10000)
    const divisoes = [new DivisaoDeGasto('m1', Dinheiro.deCentavos(10000))]
    const gasto = new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'Mercado', valorTotal: total, divisoes })
    expect(gasto.valorTotal.getCentavos()).toBe(10000)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run src/modules/ledger/core/domain/Cartao.test.ts src/modules/ledger/core/domain/Gasto.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Write implementation for Cartao, DivisaoDeGasto and Gasto**

```typescript
// src/modules/ledger/core/domain/Cartao.ts
export interface CartaoProps {
  id: string
  nome: string
  diaFechamento: number
  responsavelPadraoId: string
}

export class Cartao {
  public readonly id: string
  public readonly nome: string
  public readonly diaFechamento: number
  public readonly responsavelPadraoId: string

  constructor(props: CartaoProps) {
    if (props.diaFechamento < 1 || props.diaFechamento > 28) {
      throw new Error('Dia de fechamento deve ser entre 1 e 28')
    }
    this.id = props.id
    this.nome = props.nome
    this.diaFechamento = props.diaFechamento
    this.responsavelPadraoId = props.responsavelPadraoId
  }
}
```

```typescript
// src/modules/ledger/core/domain/DivisaoDeGasto.ts
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

export class DivisaoDeGasto {
  constructor(
    public readonly membroId: string,
    public readonly valor: Dinheiro
  ) {}
}
```

```typescript
// src/modules/ledger/core/domain/Gasto.ts
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from './DivisaoDeGasto'

export interface GastoProps {
  id: string
  faturaId: string
  descricao: string
  valorTotal: Dinheiro
  divisoes: DivisaoDeGasto[]
}

export class Gasto {
  public readonly id: string
  public readonly faturaId: string
  public readonly descricao: string
  public readonly valorTotal: Dinheiro
  public readonly divisoes: DivisaoDeGasto[]

  constructor(props: GastoProps) {
    const soma = props.divisoes.reduce((acc, d) => acc.somar(d.valor), Dinheiro.deCentavos(0))
    if (!soma.equals(props.valorTotal)) {
      throw new Error('A soma das divisões deve ser igual ao valor total do gasto')
    }
    
    this.id = props.id
    this.faturaId = props.faturaId
    this.descricao = props.descricao
    this.valorTotal = props.valorTotal
    this.divisoes = props.divisoes
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run src/modules/ledger/core/domain/Cartao.test.ts src/modules/ledger/core/domain/Gasto.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
Run: `git add src/modules/ledger/core/domain/Cartao.ts src/modules/ledger/core/domain/Cartao.test.ts src/modules/ledger/core/domain/DivisaoDeGasto.ts src/modules/ledger/core/domain/Gasto.ts src/modules/ledger/core/domain/Gasto.test.ts && git commit -m "feat(domain): implement Cartao, DivisaoDeGasto and Gasto entities"`

---

### Task 2: Entidades Antecipação e AcertoMembro

**Files:**
- Create: `src/modules/ledger/core/domain/Antecipacao.ts`
- Create: `src/modules/ledger/core/domain/Antecipacao.test.ts`
- Create: `src/modules/ledger/core/domain/AcertoMembro.ts`
- Create: `src/modules/ledger/core/domain/AcertoMembro.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/modules/ledger/core/domain/Antecipacao.test.ts
import { describe, it, expect } from 'vitest'
import { Antecipacao } from './Antecipacao'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

describe('Antecipacao', () => {
  it('deve criar antecipacao corretamente', () => {
    const a = new Antecipacao({ id: 'a1', faturaId: 'f1', membroId: 'm1', valor: Dinheiro.deCentavos(5000), data: new Date() })
    expect(a.valor.getCentavos()).toBe(5000)
  })
})
```

```typescript
// src/modules/ledger/core/domain/AcertoMembro.test.ts
import { describe, it, expect } from 'vitest'
import { AcertoMembro } from './AcertoMembro'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

describe('AcertoMembro', () => {
  it('deve calcular tipo MEMBRO_PAGA quando consumo > antecipado', () => {
    const acerto = new AcertoMembro({
      id: 'ac1', faturaId: 'f1', membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(10000),
      totalAntecipado: Dinheiro.deCentavos(2000)
    })
    expect(acerto.tipo).toBe('MEMBRO_PAGA')
    expect(acerto.valorAcerto.getCentavos()).toBe(8000)
  })

  it('deve calcular tipo RESPONSAVEL_PAGA quando antecipado > consumo', () => {
    const acerto = new AcertoMembro({
      id: 'ac2', faturaId: 'f1', membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(5000),
      totalAntecipado: Dinheiro.deCentavos(12000)
    })
    expect(acerto.tipo).toBe('RESPONSAVEL_PAGA')
    expect(acerto.valorAcerto.getCentavos()).toBe(7000)
  })
})
```

- [ ] **Step 2: Run tests to fail**
Run: `npx vitest run src/modules/ledger/core/domain/Antecipacao.test.ts src/modules/ledger/core/domain/AcertoMembro.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement entities**

```typescript
// src/modules/ledger/core/domain/Antecipacao.ts
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

export interface AntecipacaoProps {
  id: string
  faturaId: string
  membroId: string
  valor: Dinheiro
  data: Date
}

export class Antecipacao {
  public readonly id: string
  public readonly faturaId: string
  public readonly membroId: string
  public readonly valor: Dinheiro
  public readonly data: Date

  constructor(props: AntecipacaoProps) {
    this.id = props.id
    this.faturaId = props.faturaId
    this.membroId = props.membroId
    this.valor = props.valor
    this.data = props.data
  }
}
```

```typescript
// src/modules/ledger/core/domain/AcertoMembro.ts
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

export type TipoAcerto = 'MEMBRO_PAGA' | 'RESPONSAVEL_PAGA'

export interface AcertoMembroProps {
  id: string
  faturaId: string
  membroId: string
  totalConsumido: Dinheiro
  totalAntecipado: Dinheiro
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
  public pago: boolean
  public dataPagamento?: Date

  constructor(props: AcertoMembroProps) {
    this.id = props.id
    this.faturaId = props.faturaId
    this.membroId = props.membroId
    this.totalConsumido = props.totalConsumido
    this.totalAntecipado = props.totalAntecipado
    this.pago = props.pago ?? false
    this.dataPagamento = props.dataPagamento
    
    const diff = props.totalConsumido.getCentavos() - props.totalAntecipado.getCentavos()
    this.valorAcerto = Dinheiro.deCentavos(Math.abs(diff))
    this.tipo = diff >= 0 ? 'MEMBRO_PAGA' : 'RESPONSAVEL_PAGA'
  }

  marcarComoPago(data: Date = new Date()) {
    this.pago = true
    this.dataPagamento = data
  }
}
```

- [ ] **Step 4: Verify pass**
Run: `npx vitest run src/modules/ledger/core/domain/Antecipacao.test.ts src/modules/ledger/core/domain/AcertoMembro.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
Run: `git add src/modules/ledger/core/domain/Antecipacao* src/modules/ledger/core/domain/AcertoMembro* && git commit -m "feat(domain): implement Antecipacao and AcertoMembro"`

---

### Task 3: Entidade Fatura e Lógica de Período

**Files:**
- Create: `src/modules/ledger/core/domain/Fatura.ts`
- Create: `src/modules/ledger/core/domain/Fatura.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/modules/ledger/core/domain/Fatura.test.ts
import { describe, it, expect } from 'vitest'
import { Fatura, determinarPeriodoFatura } from './Fatura'

describe('Fatura', () => {
  it('determinarPeriodoFatura - gasto antes do fechamento pertence a fatura do mes de fechamento', () => {
    // Fechamento dia 10. Gasto dia 8/Maio (08/05/2026) -> Fatura com periodo { mes: 5, ano: 2026 } (Maio)
    const dataGasto = new Date('2026-05-08T10:00:00Z')
    const periodo = determinarPeriodoFatura(dataGasto, 10)
    expect(periodo).toEqual({ mes: 5, ano: 2026 })
  })

  it('determinarPeriodoFatura - gasto no dia exato do fechamento pertence ao proximo mes', () => {
    // Gasto dia 10/Maio -> Fatura Junho (mes 6)
    const dataGasto = new Date('2026-05-10T10:00:00Z')
    const periodo = determinarPeriodoFatura(dataGasto, 10)
    expect(periodo).toEqual({ mes: 6, ano: 2026 })
  })
  
  it('determinarPeriodoFatura - vira o ano corretamente', () => {
    // Gasto 10/Dez -> Fatura Janeiro ano seguinte
    const dataGasto = new Date('2026-12-10T10:00:00Z')
    const periodo = determinarPeriodoFatura(dataGasto, 10)
    expect(periodo).toEqual({ mes: 1, ano: 2027 })
  })

  it('deve rejeitar operacoes quando fatura nao esta ABERTA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA' })
    expect(() => fatura.validarOperacaoPermitida()).toThrow('Fatura não está ABERTA')
  })
})
```

- [ ] **Step 2: Run to fail**
Run: `npx vitest run src/modules/ledger/core/domain/Fatura.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Fatura**

```typescript
// src/modules/ledger/core/domain/Fatura.ts
export type FaturaStatus = 'ABERTA' | 'FECHADA' | 'ACERTADA'

export interface FaturaPeriodo {
  mes: number // 1 a 12
  ano: number
}

export interface FaturaProps {
  id: string
  cartaoId: string
  periodo: FaturaPeriodo
  responsavelId: string
  status: FaturaStatus
  dataPagamentoBanco?: Date
}

export function determinarPeriodoFatura(dataGasto: Date, diaFechamento: number): FaturaPeriodo {
  const diaGasto = dataGasto.getUTCDate()
  let mes = dataGasto.getUTCMonth() + 1
  let ano = dataGasto.getUTCFullYear()

  // Se o dia do gasto for maior ou igual ao dia de fechamento, cai na fatura do mês seguinte
  if (diaGasto >= diaFechamento) {
    mes += 1
    if (mes > 12) {
      mes = 1
      ano += 1
    }
  }
  return { mes, ano }
}

export class Fatura {
  public readonly id: string
  public readonly cartaoId: string
  public readonly periodo: FaturaPeriodo
  public readonly responsavelId: string
  public status: FaturaStatus
  public dataPagamentoBanco?: Date

  constructor(props: FaturaProps) {
    this.id = props.id
    this.cartaoId = props.cartaoId
    this.periodo = props.periodo
    this.responsavelId = props.responsavelId
    this.status = props.status
    this.dataPagamentoBanco = props.dataPagamentoBanco
  }

  validarOperacaoPermitida() {
    if (this.status !== 'ABERTA') {
      throw new Error('Fatura não está ABERTA')
    }
  }

  fechar(dataPagamentoBanco: Date = new Date()) {
    if (this.status !== 'ABERTA') throw new Error('Apenas faturas ABERTAS podem ser fechadas')
    this.status = 'FECHADA'
    this.dataPagamentoBanco = dataPagamentoBanco
  }

  marcarAcertada() {
    if (this.status !== 'FECHADA') throw new Error('Apenas faturas FECHADAS podem ser acertadas')
    this.status = 'ACERTADA'
  }
}
```

- [ ] **Step 4: Verify pass**
Run: `npx vitest run src/modules/ledger/core/domain/Fatura.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
Run: `git add src/modules/ledger/core/domain/Fatura* && git commit -m "feat(domain): implement Fatura and determination logic"`

---

### Task 4: Repositories Interfaces

**Files:**
- Create: `src/modules/ledger/core/ports/ICartaoRepository.ts`
- Create: `src/modules/ledger/core/ports/IFaturaRepository.ts`
- Create: `src/modules/ledger/core/ports/IGastoRepository.ts`
- Create: `src/modules/ledger/core/ports/IAntecipacaoRepository.ts`
- Create: `src/modules/ledger/core/ports/IAcertoMembroRepository.ts`

- [ ] **Step 1: Write the interfaces (No tests needed for simple interfaces)**

```typescript
// src/modules/ledger/core/ports/ICartaoRepository.ts
import { Cartao } from '../domain/Cartao'

export interface ICartaoRepository {
  buscarPorId(id: string): Promise<Cartao | null>
  salvar(cartao: Cartao): Promise<void>
}
```

```typescript
// src/modules/ledger/core/ports/IFaturaRepository.ts
import { Fatura, FaturaPeriodo } from '../domain/Fatura'

export interface IFaturaRepository {
  buscarPorId(id: string): Promise<Fatura | null>
  buscarPorCartaoEPeriodo(cartaoId: string, periodo: FaturaPeriodo): Promise<Fatura | null>
  salvar(fatura: Fatura): Promise<void>
}
```

```typescript
// src/modules/ledger/core/ports/IGastoRepository.ts
import { Gasto } from '../domain/Gasto'

export interface IGastoRepository {
  buscarPorFatura(faturaId: string): Promise<Gasto[]>
  salvar(gasto: Gasto): Promise<void>
}
```

```typescript
// src/modules/ledger/core/ports/IAntecipacaoRepository.ts
import { Antecipacao } from '../domain/Antecipacao'

export interface IAntecipacaoRepository {
  buscarPorFatura(faturaId: string): Promise<Antecipacao[]>
  salvar(antecipacao: Antecipacao): Promise<void>
}
```

```typescript
// src/modules/ledger/core/ports/IAcertoMembroRepository.ts
import { AcertoMembro } from '../domain/AcertoMembro'

export interface IAcertoMembroRepository {
  buscarPorFatura(faturaId: string): Promise<AcertoMembro[]>
  salvar(acerto: AcertoMembro): Promise<void>
}
```

- [ ] **Step 2: Commit**
Run: `git add src/modules/ledger/core/ports/* && git commit -m "feat(ports): add interfaces for new ledger cycle entities"`

---

### Task 5: Domain Services - FaturaService

**Files:**
- Create: `src/modules/ledger/core/services/FaturaService.ts`
- Create: `src/modules/ledger/core/services/FaturaService.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/modules/ledger/core/services/FaturaService.test.ts
import { describe, it, expect, vi } from 'vitest'
import { FaturaService } from './FaturaService'
import { Fatura } from '../domain/Fatura'
import { Gasto } from '../domain/Gasto'
import { DivisaoDeGasto } from '../domain/DivisaoDeGasto'
import { Antecipacao } from '../domain/Antecipacao'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

describe('FaturaService', () => {
  it('deve fechar a fatura e persistir AcertosMembro ignorando o responsavel', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const gastos = [
      new Gasto({ id: 'g1', faturaId: 'f1', descricao: '', valorTotal: Dinheiro.deCentavos(200), divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(100)), new DivisaoDeGasto('m2', Dinheiro.deCentavos(100))] })
    ]
    const antecipacoes = [
      new Antecipacao({ id: 'a1', faturaId: 'f1', membroId: 'm2', valor: Dinheiro.deCentavos(50), data: new Date() })
    ]

    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn() }
    const gastoRepo = { buscarPorFatura: vi.fn().mockResolvedValue(gastos), salvar: vi.fn() }
    const antRepo = { buscarPorFatura: vi.fn().mockResolvedValue(antecipacoes), salvar: vi.fn() }
    const acertoRepo = { buscarPorFatura: vi.fn(), salvar: vi.fn() }

    const service = new FaturaService(faturaRepo as any, gastoRepo as any, antRepo as any, acertoRepo as any)
    await service.fecharFatura('f1', new Date())

    expect(fatura.status).toBe('FECHADA')
    expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
    // Apenas m2 deve ter acerto, pois m1 é o responsável
    expect(acertoRepo.salvar).toHaveBeenCalledTimes(1)
    const acertoSalvo = acertoRepo.salvar.mock.calls[0][0]
    expect(acertoSalvo.membroId).toBe('m2')
    expect(acertoSalvo.valorAcerto.getCentavos()).toBe(50) // 100 consumo - 50 antecipado
    expect(acertoSalvo.tipo).toBe('MEMBRO_PAGA')
  })
})
```

- [ ] **Step 2: Run to fail**
Run: `npx vitest run src/modules/ledger/core/services/FaturaService.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement FaturaService**

```typescript
// src/modules/ledger/core/services/FaturaService.ts
import { IFaturaRepository } from '../ports/IFaturaRepository'
import { IGastoRepository } from '../ports/IGastoRepository'
import { IAntecipacaoRepository } from '../ports/IAntecipacaoRepository'
import { IAcertoMembroRepository } from '../ports/IAcertoMembroRepository'
import { AcertoMembro } from '../domain/AcertoMembro'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

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

    const gastos = await this.gastoRepo.buscarPorFatura(faturaId)
    const antecipacoes = await this.antecipacaoRepo.buscarPorFatura(faturaId)

    const consumoMap = new Map<string, number>()
    gastos.forEach(g => {
      g.divisoes.forEach(d => {
        consumoMap.set(d.membroId, (consumoMap.get(d.membroId) || 0) + d.valor.getCentavos())
      })
    })

    const antMap = new Map<string, number>()
    antecipacoes.forEach(a => {
      antMap.set(a.membroId, (antMap.get(a.membroId) || 0) + a.valor.getCentavos())
    })

    const membrosIds = new Set([...consumoMap.keys(), ...antMap.keys()])
    membrosIds.delete(fatura.responsavelId) // Regra 1: Excluir responsavel

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

    fatura.fechar(dataPagamentoBanco)
    await this.faturaRepo.salvar(fatura)
  }
}
```

- [ ] **Step 4: Verify pass**
Run: `npx vitest run src/modules/ledger/core/services/FaturaService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
Run: `git add src/modules/ledger/core/services/FaturaService* && git commit -m "feat(services): implement FaturaService for invoice closing"`

---

### Task 6: Domain Services - AcertoService

**Files:**
- Create: `src/modules/ledger/core/services/AcertoService.ts`
- Create: `src/modules/ledger/core/services/AcertoService.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/modules/ledger/core/services/AcertoService.test.ts
import { describe, it, expect, vi } from 'vitest'
import { AcertoService } from './AcertoService'
import { AcertoMembro } from '../domain/AcertoMembro'
import { Fatura } from '../domain/Fatura'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

describe('AcertoService', () => {
  it('deve marcar acerto como pago e transicionar fatura para ACERTADA se for o ultimo', async () => {
    const acerto1 = new AcertoMembro({ id: 'a1', faturaId: 'f1', membroId: 'm1', totalConsumido: Dinheiro.deCentavos(100), totalAntecipado: Dinheiro.deCentavos(0) })
    const acerto2 = new AcertoMembro({ id: 'a2', faturaId: 'f1', membroId: 'm2', totalConsumido: Dinheiro.deCentavos(100), totalAntecipado: Dinheiro.deCentavos(0), pago: true })
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA' })

    const acertoRepo = { 
      buscarPorId: vi.fn().mockResolvedValue(acerto1), 
      buscarPorFatura: vi.fn().mockResolvedValue([acerto1, acerto2]),
      salvar: vi.fn() 
    }
    const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn() }

    const service = new AcertoService(acertoRepo as any, faturaRepo as any)
    await service.marcarPago('a1', new Date())

    expect(acerto1.pago).toBe(true)
    expect(acertoRepo.salvar).toHaveBeenCalledWith(acerto1)
    expect(fatura.status).toBe('ACERTADA')
    expect(faturaRepo.salvar).toHaveBeenCalledWith(fatura)
  })
})
```

- [ ] **Step 2: Run to fail**
Run: `npx vitest run src/modules/ledger/core/services/AcertoService.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement AcertoService**

```typescript
// src/modules/ledger/core/services/AcertoService.ts
import { IAcertoMembroRepository } from '../ports/IAcertoMembroRepository'
import { IFaturaRepository } from '../ports/IFaturaRepository'

export class AcertoService {
  constructor(
    private acertoRepo: IAcertoMembroRepository,
    private faturaRepo: IFaturaRepository
  ) {}

  async marcarPago(acertoId: string, dataPagamento: Date = new Date()): Promise<void> {
    const acerto = await this.acertoRepo.buscarPorId(acertoId)
    if (!acerto) throw new Error('Acerto não encontrado')

    acerto.marcarComoPago(dataPagamento)
    await this.acertoRepo.salvar(acerto)

    const acertos = await this.acertoRepo.buscarPorFatura(acerto.faturaId)
    const todosQuitados = acertos.every(a => a.pago)

    if (todosQuitados) {
      const fatura = await this.faturaRepo.buscarPorId(acerto.faturaId)
      if (fatura) {
        fatura.marcarAcertada()
        await this.faturaRepo.salvar(fatura)
      }
    }
  }
}
```

- [ ] **Step 4: Verify pass**
Run: `npx vitest run src/modules/ledger/core/services/AcertoService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
Run: `git add src/modules/ledger/core/services/AcertoService* && git commit -m "feat(services): implement AcertoService for automatic status transition"`

---

**Execution Handoff:**
Plan complete and saved to `docs/superpowers/plans/2026-05-17-ciclos-gasto-pagamento-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?