# Refatoração e Limpeza MVVM Estrito Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limpar código morto (Antecipacao), reduzir a complexidade ciclomática do `useDashboardViewModel` e reforçar a separação de camadas MVVM.

**Architecture:** MVVM Estrito com injeção de dependências via parâmetros opcionais e fallback para `container.ts`. Lógica de negócio e cálculos movidos para Services; formatação movida para Utils.

**Tech Stack:** Vue 3 (Composition API), TypeScript, Vitest.

---

### Task 1: Remoção de Código Morto (Antecipacao)

**Files:**
- Modify: `src/models/services/FaturaService.ts`
- Modify: `src/shared/container.ts`
- Modify: `src/viewmodels/useCartoesEFaturas.ts`
- Delete: `src/models/entities/Antecipacao.ts`
- Delete: `src/models/entities/Antecipacao.test.ts`
- Delete: `src/models/repositories/IAntecipacaoRepository.ts`
- Delete: `src/models/repositories/local/LocalStorageAntecipacaoRepository.ts`

- [ ] **Step 1: Remover Antecipação do FaturaService**

Remover o repositório do construtor e a lógica de uso no método `confirmarAcertos`.

```typescript
// src/models/services/FaturaService.ts
// Remover import de IAntecipacaoRepository
// ...
export class FaturaService implements IFaturaService {
  constructor(
    private faturaRepo: IFaturaRepository,
    private gastoRepo: IGastoRepository,
    // private antecipacaoRepo: IAntecipacaoRepository, // REMOVER
    private acertoRepo: IAcertoMembroRepository
  ) {}

  async confirmarAcertos(faturaId: string): Promise<void> {
    // ...
    const gastos = await this.gastoRepo.buscarPorFatura(faturaId)
    // const antecipacoes = await this.antecipacaoRepo.buscarPorFatura(faturaId) // REMOVER

    // ... lógica de consumo mantida ...

    // REMOVER bloco de antecipacoes:
    // const antMap = new Map<string, number>()
    // antecipacoes.forEach(a => { ... })

    // Ajustar Set de membros (remover antMap)
    const membrosIds = new Set([...consumoMap.keys()])
    // ...
    for (const membroId of membrosIds) {
      const consumo = Dinheiro.deCentavos(consumoMap.get(membroId) || 0)
      // const antecipado = Dinheiro.deCentavos(0) // Fixar em 0 ou remover prop do AcertoMembro se aplicável

      const acerto = new AcertoMembro({
        id: crypto.randomUUID(),
        faturaId: fatura.id,
        membroId,
        totalConsumido: consumo,
        totalAntecipado: Dinheiro.deCentavos(0)
      })
      // ...
    }
  }
}
```

- [ ] **Step 2: Remover do container.ts**

```typescript
// src/shared/container.ts
// Remover imports de Antecipacao
// ...
// export const antecipacaoRepository = new LocalStorageAntecipacaoRepository() // REMOVER
// ...
export const faturaService = new FaturaService(faturaRepository, gastoRepository, acertoMembroRepository) // REMOVER antecipacaoRepository
```

- [ ] **Step 3: Remover do useCartoesEFaturas.ts**

```typescript
// src/viewmodels/useCartoesEFaturas.ts
// Remover referências a antecipacoes e localAntRepo
```

- [ ] **Step 4: Excluir os arquivos físicos**

Run: `rm src/models/entities/Antecipacao.ts src/models/entities/Antecipacao.test.ts src/models/repositories/IAntecipacaoRepository.ts src/models/repositories/local/LocalStorageAntecipacaoRepository.ts`

- [ ] **Step 5: Validar com testes**

Run: `npx vitest run`
Expected: 140 testes passando (os testes de Antecipacao foram removidos, o total deve cair para ~138).

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "refactor: remove dead code (Antecipacao)"
```

---

### Task 2: Extração de Lógica de Formatação e Helpers

**Files:**
- Modify: `src/shared/utils/meses.ts`
- Modify: `src/viewmodels/useDashboardViewModel.ts`

- [ ] **Step 1: Adicionar helpers em meses.ts**

Mover a lógica de geração da lista de meses do ViewModel para utils.

```typescript
// src/shared/utils/meses.ts
export function gerarListaMesesSeletor(faturasFechadas: any[]) {
  const hoje = new Date()
  const list = []
  for (let i = -12; i <= 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
    const mesIdx = d.getMonth() + 1
    const anoIdx = d.getFullYear()
    const estaFechada = faturasFechadas.some(f => f.periodo.mes === mesIdx && f.periodo.ano === anoIdx)
    list.push({
      mes: mesIdx,
      ano: anoIdx,
      nome: formatarMesAno(mesIdx, anoIdx),
      status: estaFechada ? 'FECHADA' : 'ABERTA'
    })
  }
  return list
}
```

- [ ] **Step 2: Simplificar useDashboardViewModel.ts**

Usar o novo helper e remover lógica redundante.

```typescript
// src/viewmodels/useDashboardViewModel.ts
import { gerarListaMesesSeletor } from '../shared/utils/meses'
// ...
const listaMesesSeletor = computed(() => gerarListaMesesSeletor(props.faturasFechadas))
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/utils/meses.ts src/viewmodels/useDashboardViewModel.ts
git commit -m "refactor: extract month selection logic to utils"
```

---

### Task 3: Redução de Complexidade no useDashboardViewModel

**Files:**
- Modify: `src/viewmodels/useDashboardViewModel.ts`

- [ ] **Step 1: Consolidar estados de UI**

Agrupar flags booleanas de BottomSheets em um único objeto de estado se necessário, ou apenas simplificar os métodos de abertura.

- [ ] **Step 2: Mover cálculos para Services**

Se houver lógicas de filtragem complexas, mover para `NettingService` ou similar. No `useDashboardViewModel.ts`, garantir que os `computed` sejam diretos.

- [ ] **Step 3: Validar e Commit**

Run: `npx vitest run src/viewmodels/useDashboardViewModel.test.ts`
Expected: PASS

```bash
git add src/viewmodels/useDashboardViewModel.ts
git commit -m "refactor: reduce cyclomatic complexity in DashboardViewModel"
```

---

### Task 4: Limpeza da View e Validação Final

**Files:**
- Modify: `src/views/screens/DashboardSaldos.vue`
- Modify: `src/App.vue`

- [ ] **Step 1: Limpar DashboardSaldos.vue**

Remover refs não utilizadas e imports órfãos detectados após as mudanças nas ViewModels.

- [ ] **Step 2: Auditoria de Imports**

Verificar em toda a `src/` se restou algum import de `Antecipacao`.

Run: `grep -r "Antecipacao" src/`
Expected: No results.

- [ ] **Step 3: Validação Final**

Run: `npx vitest run && npm run build`
Expected: All tests pass and build successful.

- [ ] **Step 4: Commit Final**

```bash
git add .
git commit -m "refactor: final cleanup and mvvm reinforcement"
```
