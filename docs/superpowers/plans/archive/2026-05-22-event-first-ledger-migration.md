# Event-First Ledger Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the financial core (Ledger) from a CRUD model to Event Sourcing, ensuring auditability and domain purity.

**Architecture:** Implement CQRS with a pure `LedgerAggregate` for command validation, an immutable `EventStore` for persistence, and `LedgerProjections` for rebuilding state.

**Tech Stack:** TypeScript, Vue 3, LocalStorage, Vitest.

---

### Task 1: Define Domain Events and IEventStore Interface

**Files:**
- Create: `src/models/entities/LedgerEvent.ts`
- Create: `src/models/repositories/IEventStore.ts`

- [ ] **Step 1: Define the Event Types and Schema**
Create `src/models/entities/LedgerEvent.ts` with the events defined in the spec.

```typescript
export type LedgerEventType = 
  | 'GASTO_LANCADO' 
  | 'GASTO_ESTORNADO' 
  | 'FATURA_FECHADA' 
  | 'ACERTO_REGISTRADO' 
  | 'MEMBRO_ADICIONADO'
  | 'MIGRACAO_ESTADO_INICIAL';

export interface LedgerEvent<T = any> {
  id: string;
  type: LedgerEventType;
  timestamp: number;
  version: number;
  payload: T;
}

export interface GastoLancadoPayload {
  id: string;
  faturaId: string;
  compradorId: string;
  valorCentavos: number;
  divisoes: { membroId: string; valorCentavos: number }[];
  descricao: string;
  paymentMethod: 'pix' | 'card';
  cardOwnerId?: string | null;
}
```

- [ ] **Step 2: Define the EventStore Interface**
Create `src/models/repositories/IEventStore.ts`.

```typescript
import { LedgerEvent } from '../entities/LedgerEvent';

export interface IEventStore {
  append(events: LedgerEvent[]): Promise<void>;
  getStream(): Promise<LedgerEvent[]>;
  clear(): Promise<void>;
}
```

- [ ] **Step 3: Commit definitions**
```bash
git add src/models/entities/LedgerEvent.ts src/models/repositories/IEventStore.ts
git commit -m "domain: define LedgerEvent and IEventStore"
```

---

### Task 2: Implement LocalStorageEventStore

**Files:**
- Create: `src/models/repositories/local/LocalStorageEventStore.ts`
- Create: `src/models/repositories/local/LocalStorageEventStore.test.ts`

- [ ] **Step 1: Write failing test for EventStore**
Create `src/models/repositories/local/LocalStorageEventStore.test.ts`.

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageEventStore } from './LocalStorageEventStore';

describe('LocalStorageEventStore', () => {
  let store: LocalStorageEventStore;

  beforeEach(() => {
    localStorage.clear();
    store = new LocalStorageEventStore();
  });

  it('should append and retrieve events', async () => {
    const event = { id: '1', type: 'GASTO_LANCADO', timestamp: Date.now(), version: 1, payload: {} };
    await store.append([event as any]);
    const stream = await store.getStream();
    expect(stream).toHaveLength(1);
    expect(stream[0].id).toBe('1');
  });
});
```

- [ ] **Step 2: Run test and verify failure**
Run: `npx vitest run src/models/repositories/local/LocalStorageEventStore.test.ts`
Expected: FAIL (Class not found).

- [ ] **Step 3: Implement LocalStorageEventStore**
Create `src/models/repositories/local/LocalStorageEventStore.ts`.

```typescript
import { IEventStore } from '../IEventStore';
import { LedgerEvent } from '../../entities/LedgerEvent';

export class LocalStorageEventStore implements IEventStore {
  private readonly STORAGE_KEY = 'divi_event_stream';

  async append(events: LedgerEvent[]): Promise<void> {
    const current = await this.getStream();
    const updated = [...current, ...events];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  async getStream(): Promise<LedgerEvent[]> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
```

- [ ] **Step 4: Run test and verify success**
Run: `npx vitest run src/models/repositories/local/LocalStorageEventStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/models/repositories/local/LocalStorageEventStore.ts src/models/repositories/local/LocalStorageEventStore.test.ts
git commit -m "infra: implement LocalStorageEventStore"
```

---

### Task 3: Implement LedgerAggregate (Pure Logic)

**Files:**
- Create: `src/models/entities/LedgerAggregate.ts`
- Create: `src/models/entities/LedgerAggregate.test.ts`

- [ ] **Step 1: Write failing test for Aggregate validation**
Create `src/models/entities/LedgerAggregate.test.ts`. Test that a command is rejected if the fatura is already closed.

```typescript
import { describe, it, expect } from 'vitest';
import { LedgerAggregate } from './LedgerAggregate';

describe('LedgerAggregate', () => {
  it('should reject Gasto if fatura is closed', () => {
    const aggregate = new LedgerAggregate();
    // Simulate closed fatura by applying event
    aggregate.apply({ type: 'FATURA_FECHADA', payload: { faturaId: 'f1' } } as any);
    
    expect(() => aggregate.validateLancarGasto('f1')).toThrow('Fatura trancada');
  });
});
```

- [ ] **Step 2: Run test and verify failure**
Expected: FAIL.

- [ ] **Step 3: Implement LedgerAggregate**
Create `src/models/entities/LedgerAggregate.ts`.

```typescript
import { LedgerEvent } from './LedgerEvent';

export class LedgerAggregate {
  private closedFaturas = new Set<string>();

  apply(event: LedgerEvent): void {
    if (event.type === 'FATURA_FECHADA') {
      this.closedFaturas.add(event.payload.faturaId);
    }
  }

  validateLancarGasto(faturaId: string): void {
    if (this.closedFaturas.has(faturaId)) {
      throw new Error('Fatura trancada para novos lançamentos');
    }
  }

  static rebuild(events: LedgerEvent[]): LedgerAggregate {
    const aggregate = new LedgerAggregate();
    events.forEach(e => aggregate.apply(e));
    return aggregate;
  }
}
```

- [ ] **Step 4: Run test and verify success**
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/models/entities/LedgerAggregate.ts src/models/entities/LedgerAggregate.test.ts
git commit -m "domain: implement LedgerAggregate pure logic"
```

---

### Task 4: Implement LedgerProjections (Read Models)

**Files:**
- Create: `src/models/services/LedgerProjections.ts`
- Create: `src/models/services/LedgerProjections.test.ts`

- [ ] **Step 1: Write test for balance projection**
Create `src/models/services/LedgerProjections.test.ts`.

```typescript
import { describe, it, expect } from 'vitest';
import { LedgerProjections } from './LedgerProjections';

describe('LedgerProjections', () => {
  it('should compute balances from GastoLancado events', () => {
    const events = [{
      type: 'GASTO_LANCADO',
      payload: { 
        valorCentavos: 1000, 
        compradorId: 'm1', 
        divisoes: [{ membroId: 'm2', valorCentavos: 1000 }] 
      }
    }];
    const saldos = LedgerProjections.computeSaldos(events as any);
    expect(saldos['m1']).toBe(1000); // m1 lent 1000
    expect(saldos['m2']).toBe(-1000); // m2 owes 1000
  });
});
```

- [ ] **Step 2: Run test and verify failure**
Expected: FAIL.

- [ ] **Step 3: Implement LedgerProjections**
Create `src/models/services/LedgerProjections.ts`.

```typescript
import { LedgerEvent } from '../entities/LedgerEvent';

export class LedgerProjections {
  static computeSaldos(events: LedgerEvent[]): Record<string, number> {
    const saldos: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.type === 'GASTO_LANCADO') {
        const { compradorId, valorCentavos, divisoes } = event.payload;
        saldos[compradorId] = (saldos[compradorId] || 0) + valorCentavos;
        divisoes.forEach((d: any) => {
          saldos[d.membroId] = (saldos[d.membroId] || 0) - d.valorCentavos;
        });
      }
    });
    
    return saldos;
  }
}
```

- [ ] **Step 4: Run test and verify success**
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/models/services/LedgerProjections.ts src/models/services/LedgerProjections.test.ts
git commit -m "domain: implement LedgerProjections"
```

---

### Task 5: Implement LedgerService (Command Handler)

**Files:**
- Create: `src/models/services/LedgerService.ts`
- Modify: `src/shared/container.ts`

- [ ] **Step 1: Implement LedgerService**
Create `src/models/services/LedgerService.ts`. This service orchestrates the Aggregate and the EventStore.

```typescript
import { IEventStore } from '../repositories/IEventStore';
import { LedgerAggregate } from '../entities/LedgerAggregate';
import { LedgerEvent, GastoLancadoPayload } from '../entities/LedgerEvent';

export class LedgerService {
  constructor(private eventStore: IEventStore) {}

  async lancarGasto(payload: GastoLancadoPayload): Promise<void> {
    const events = await this.eventStore.getStream();
    const aggregate = LedgerAggregate.rebuild(events);
    
    aggregate.validateLancarGasto(payload.faturaId);
    
    const event: LedgerEvent = {
      id: crypto.randomUUID(),
      type: 'GASTO_LANCADO',
      timestamp: Date.now(),
      version: events.length + 1,
      payload
    };
    
    await this.eventStore.append([event]);
  }
}
```

- [ ] **Step 2: Register in Container**
Modify `src/shared/container.ts` to include `eventStore` and `ledgerService`.

- [ ] **Step 3: Commit**
```bash
git add src/models/services/LedgerService.ts src/shared/container.ts
git commit -m "feat: implement LedgerService command handler"
```

---

### Task 4: Implement BootstrapEventGenerator (Migration)

**Files:**
- Create: `src/models/services/BootstrapEventGenerator.ts`

- [ ] **Step 1: Implement Migration Logic**
Create `src/models/services/BootstrapEventGenerator.ts` to convert current LocalStorage data to events.

```typescript
import { IEventStore } from '../repositories/IEventStore';
import { IGastoRepository } from '../repositories/IGastoRepository';

export class BootstrapEventGenerator {
  constructor(
    private eventStore: IEventStore,
    private gastoRepo: IGastoRepository
  ) {}

  async migrate(): Promise<void> {
    const existingEvents = await this.eventStore.getStream();
    if (existingEvents.length > 0) return; // Already migrated

    const gastos = await this.gastoRepo.listarTodos();
    const migrationEvents = gastos.map(g => ({
      id: crypto.randomUUID(),
      type: 'GASTO_LANCADO' as const,
      timestamp: Date.now(),
      version: 0,
      payload: {
        id: g.id,
        faturaId: g.faturaId,
        compradorId: g.compradorId,
        valorCentavos: g.valorTotal.centavos,
        divisoes: g.divisoes.map(d => ({ membroId: d.membroId, valorCentavos: d.valor.centavos })),
        descricao: g.descricao,
        paymentMethod: g.method || 'card'
      }
    }));

    await this.eventStore.append(migrationEvents);
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add src/models/services/BootstrapEventGenerator.ts
git commit -m "feat: implement BootstrapEventGenerator migration"
```

---

### Task 7: Final Integration and UI Validation

**Files:**
- Modify: `src/viewmodels/useDashboardViewModel.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Trigger Migration on Startup**
Modify `src/main.ts` to run the bootstrap generator before mounting the app.

- [ ] **Step 2: Refactor ViewModel to use Projections**
Update `useDashboardViewModel.ts` to consume `LedgerProjections.computeSaldos` based on the `EventStore` stream.

- [ ] **Step 3: Verify overall integrity**
Run all tests: `npx vitest run`
Expected: ALL PASS.

- [ ] **Step 4: Final Commit**
```bash
git commit -am "feat: complete event-first migration integration"
```
