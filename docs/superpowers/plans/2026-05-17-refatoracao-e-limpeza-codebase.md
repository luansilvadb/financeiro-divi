# Plano de Refatoração e Limpeza da Codebase

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar a codebase do projeto DIVI eliminando arquivos órfãos, simplificando a complexidade ciclomática das funções e limpando todo o código morto para densificar o projeto de acordo com o DESIGN.md.

**Architecture:**
1. **Remoção de Arquivos de Código Morto:** Deletar fisicamente os componentes Vue de template legados (`HelloWorld.vue`, `UiShowcase.vue`), arquivos de CSS obsoletos (`style.css`), a pasta inteira do wizard antigo (`src/components/ledger/wizard/*`), os cards descontinuados do dashboard (`CardSaldoMembro`, `ItemExtratoCard`, `SugestaoAcertos`) e a documentação temporária (`TODO_MIGRATION.md`).
2. **Redução de Complexidade e Acoplamento Visual:** Refatorar o component `DashboardSaldos.vue` movendo os imports assíncronos dinâmicos de `LocalStorageGastoRepository` e `LocalStorageFaturaRepository` para imports estáticos no topo do arquivo. Isso simplifica os métodos `confirmarBaixaNetting`, `executarNovoPeriodo` e `excluirGasto`, eliminando branches de carregamento e avisos de chunks do Vite.

**Tech Stack:** Vue 3, Vite, TypeScript, Vitest, Tailwind CSS v4

---

### Task 1: Remover arquivos de código morto do projeto

**Files:**
- Delete: `src/style.css`
- Delete: `src/components/HelloWorld.vue`
- Delete: `src/components/UiShowcase.vue`
- Delete: `src/components/ledger/WizardFooter.vue`
- Delete: `src/components/ledger/WizardProgressBar.vue`
- Delete: `src/components/ledger/wizard/PassoDivisaoOpcional.vue`
- Delete: `src/components/ledger/wizard/WizardStep1Tipo.vue`
- Delete: `src/components/ledger/wizard/WizardStep2Dados.vue`
- Delete: `src/components/ledger/wizard/WizardStep3Divisao.vue`
- Delete: `src/components/ledger/dashboard/CardSaldoMembro.vue`
- Delete: `src/components/ledger/dashboard/ItemExtratoCard.vue`
- Delete: `src/components/ledger/dashboard/SugestaoAcertos.vue`
- Delete: `TODO_MIGRATION.md`

- [ ] **Step 1: Apagar os arquivos órfãos listados**

Execute a remoção via terminal de todos os arquivos legados que não são mais importados em nenhum arquivo ativo da aplicação.
Executar:
```powershell
rm src/style.css
rm src/components/HelloWorld.vue
rm src/components/UiShowcase.vue
rm src/components/ledger/WizardFooter.vue
rm src/components/ledger/WizardProgressBar.vue
rm -Recurse -Force src/components/ledger/wizard
rm src/components/ledger/dashboard/CardSaldoMembro.vue
rm src/components/ledger/dashboard/ItemExtratoCard.vue
rm src/components/ledger/dashboard/SugestaoAcertos.vue
rm TODO_MIGRATION.md
```

- [ ] **Step 2: Rodar o conjunto de testes unitários**

Certifique-se de que a remoção desses arquivos não introduziu erros de compilação ou importação quebrada.
Executar: `npx vitest run`
Expected: PASS (120 testes passando com sucesso)

- [ ] **Step 3: Testar o build de produção**

Verifique se o bundling de produção da aplicação está 100% íntegro.
Executar: `npm run build`
Expected: PASS (build concluído sem erros)

- [ ] **Step 4: Commitar as remoções no Git**

Grave as deleções de arquivos na branch.
Executar:
```bash
git add -A
git commit -m "clean: remover componentes orfaos, CSS obsoleto e pastas de codigo morto"
```

---

### Task 2: Simplificar complexidade ciclomática em `DashboardSaldos.vue`

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Modificar os imports no topo de DashboardSaldos.vue**

Adicione as importações estáticas dos repositórios no topo do script de `DashboardSaldos.vue`.

Substituir em [DashboardSaldos.vue](file:///d:/projetos/divi/src/components/ledger/DashboardSaldos.vue#L1-L15):
```typescript
import { ref, computed } from 'vue'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { useCartoesEFaturas } from '../../modules/ledger/composables/useCartoesEFaturas'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
import { Fatura } from '../../modules/ledger/core/domain/Fatura'
```
Por:
```typescript
import { ref, computed } from 'vue'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { useCartoesEFaturas } from '../../modules/ledger/composables/useCartoesEFaturas'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
import { Fatura } from '../../modules/ledger/core/domain/Fatura'
import { LocalStorageGastoRepository } from '../../modules/ledger/adapters/LocalStorageGastoRepository'
import { LocalStorageFaturaRepository } from '../../modules/ledger/adapters/LocalStorageFaturaRepository'
```

- [ ] **Step 2: Refatorar métodos assíncronos removendo imports dinâmicos**

Substituir o método `confirmarBaixaNetting` em [DashboardSaldos.vue](file:///d:/projetos/divi/src/components/ledger/DashboardSaldos.vue#L284-L312):
```typescript
const confirmarBaixaNetting = async (dados: { from: string; to: string; valor: number; method: string; descricao: string }) => {
  const activeFaturaId = props.faturasAbertas[0]?.id
  if (!activeFaturaId) return

  const { LocalStorageGastoRepository } = await import('../../modules/ledger/adapters/LocalStorageGastoRepository')
  const gRepo = new LocalStorageGastoRepository()

  const acertoGasto = new Gasto({
    id: crypto.randomUUID(),
    faturaId: activeFaturaId,
    descricao: dados.descricao,
    valorTotal: Dinheiro.deReais(dados.valor),
    compradorId: dados.to, // Credor recebe
    divisoes: [new DivisaoDeGasto(dados.from, Dinheiro.deReais(dados.valor))], // Devedor assume 100%
    isSettlement: true,
    settlementDetails: {
      fromMemberId: dados.from,
      toMemberId: dados.to,
      method: dados.method as any
    },
    installments: 1,
    isLoan: false
  })

  await gRepo.salvar(acertoGasto)
  showModalNetting.value = false
  nettingTarget.value = null
  await useCartoesEFaturas().inicializar()
}
```
Por:
```typescript
const confirmarBaixaNetting = async (dados: { from: string; to: string; valor: number; method: string; descricao: string }) => {
  const activeFaturaId = props.faturasAbertas[0]?.id
  if (!activeFaturaId) return

  const gRepo = new LocalStorageGastoRepository()

  const acertoGasto = new Gasto({
    id: crypto.randomUUID(),
    faturaId: activeFaturaId,
    descricao: dados.descricao,
    valorTotal: Dinheiro.deReais(dados.valor),
    compradorId: dados.to, // Credor recebe
    divisoes: [new DivisaoDeGasto(dados.from, Dinheiro.deReais(dados.valor))], // Devedor assume 100%
    isSettlement: true,
    settlementDetails: {
      fromMemberId: dados.from,
      toMemberId: dados.to,
      method: dados.method as any
    },
    installments: 1,
    isLoan: false
  })

  await gRepo.salvar(acertoGasto)
  showModalNetting.value = false
  nettingTarget.value = null
  await useCartoesEFaturas().inicializar()
}
```

Substituir o método `executarNovoPeriodo` em [DashboardSaldos.vue](file:///d:/projetos/divi/src/components/ledger/DashboardSaldos.vue#L347-L415):
```typescript
const executarNovoPeriodo = async (nomeNovoPeriodo: string) => {
  const fAbertas = props.faturasAbertas
  if (fAbertas.length === 0) return

  // 1. Coleta os saldos unificados acumulados live do período que está sendo fechado
  const saldosAcumulados = { ...saldosUnificadosAtivos.value }

  // 2. Fechar as faturas abertas do período
  for (const f of fAbertas) {
    await fecharFaturaManual(f.id)
  }

  // 3. Criar faturas e período no novo mês
  const [mesStr, anoStr] = nomeNovoPeriodo.split(' ')
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const mesNum = meses.indexOf(mesStr) + 1 || new Date().getMonth() + 1
  const anoNum = parseInt(anoStr) || new Date().getFullYear()

  const novasFaturas: any[] = []
  const { LocalStorageFaturaRepository } = await import('../../modules/ledger/adapters/LocalStorageFaturaRepository')
  const fRepo = new LocalStorageFaturaRepository()

  for (const card of props.cartoes) {
    const novaFatura = new Fatura({
      id: crypto.randomUUID(),
      cartaoId: card.id,
      periodo: { mes: mesNum, ano: anoNum },
      responsavelId: card.responsavelPadraoId,
      status: 'ABERTA'
    })
    await fRepo.salvar(novaFatura)
    novasFaturas.push(novaFatura)
  }

  const novaFaturaIdPrincipal = novasFaturas[0]?.id

  if (novaFaturaIdPrincipal) {
    const { LocalStorageGastoRepository } = await import('../../modules/ledger/adapters/LocalStorageGastoRepository')
    const gRepo = new LocalStorageGastoRepository()

    // 4. Decrementar parcelas ativas
    const todosGastosAnteriores: Gasto[] = []
    for (const f of fAbertas) {
      const porFatura = await gRepo.buscarPorFatura(f.id)
      todosGastosAnteriores.push(...porFatura)
    }

    const gastosParceladosNovos = processarRolloverParcelas(novaFaturaIdPrincipal, todosGastosAnteriores)
    for (const g of gastosParceladosNovos) {
      await gRepo.salvar(g)
    }

    // 5. Aplicar Netting final e carregar saldos devedores/credores como "Saldo Inicial Pendente"
    const transacoesCarryover = gerarTransacoesNettingSaldoInicial(
      novaFaturaIdPrincipal, 
      currentMonthName.value, 
      saldosAcumulados
    )
    for (const g of transacoesCarryover) {
      await gRepo.salvar(g)
    }
  }

  // 6. Destranca
  setMonthLocked(false)

  // 7. Recarrega dados reativos
  await useCartoesEFaturas().inicializar()
}
```
Por:
```typescript
const executarNovoPeriodo = async (nomeNovoPeriodo: string) => {
  const fAbertas = props.faturasAbertas
  if (fAbertas.length === 0) return

  // 1. Coleta os saldos unificados acumulados live do período que está sendo fechado
  const saldosAcumulados = { ...saldosUnificadosAtivos.value }

  // 2. Fechar as faturas abertas do período
  for (const f of fAbertas) {
    await fecharFaturaManual(f.id)
  }

  // 3. Criar faturas e período no novo mês
  const [mesStr, anoStr] = nomeNovoPeriodo.split(' ')
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const mesNum = meses.indexOf(mesStr) + 1 || new Date().getMonth() + 1
  const anoNum = parseInt(anoStr) || new Date().getFullYear()

  const novasFaturas: any[] = []
  const fRepo = new LocalStorageFaturaRepository()

  for (const card of props.cartoes) {
    const novaFatura = new Fatura({
      id: crypto.randomUUID(),
      cartaoId: card.id,
      periodo: { mes: mesNum, ano: anoNum },
      responsavelId: card.responsavelPadraoId,
      status: 'ABERTA'
    })
    await fRepo.salvar(novaFatura)
    novasFaturas.push(novaFatura)
  }

  const novaFaturaIdPrincipal = novasFaturas[0]?.id

  if (novaFaturaIdPrincipal) {
    const gRepo = new LocalStorageGastoRepository()

    // 4. Decrementar parcelas ativas
    const todosGastosAnteriores: Gasto[] = []
    for (const f of fAbertas) {
      const porFatura = await gRepo.buscarPorFatura(f.id)
      todosGastosAnteriores.push(...porFatura)
    }

    const gastosParceladosNovos = processarRolloverParcelas(novaFaturaIdPrincipal, todosGastosAnteriores)
    for (const g of gastosParceladosNovos) {
      await gRepo.salvar(g)
    }

    // 5. Aplicar Netting final e carregar saldos devedores/credores como "Saldo Inicial Pendente"
    const transacoesCarryover = gerarTransacoesNettingSaldoInicial(
      novaFaturaIdPrincipal, 
      currentMonthName.value, 
      saldosAcumulados
    )
    for (const g of transacoesCarryover) {
      await gRepo.salvar(g)
    }
  }

  // 6. Destranca
  setMonthLocked(false)

  // 7. Recarrega dados reativos
  await useCartoesEFaturas().inicializar()
}
```

Substituir o método `excluirGasto` em [DashboardSaldos.vue](file:///d:/projetos/divi/src/components/ledger/DashboardSaldos.vue#L418-L423):
```typescript
const excluirGasto = async (id: string) => {
  const { LocalStorageGastoRepository } = await import('../../modules/ledger/adapters/LocalStorageGastoRepository')
  const gRepo = new LocalStorageGastoRepository()
  await gRepo.excluir(id)
  await useCartoesEFaturas().inicializar()
}
```
Por:
```typescript
const excluirGasto = async (id: string) => {
  const gRepo = new LocalStorageGastoRepository()
  await gRepo.excluir(id)
  await useCartoesEFaturas().inicializar()
}
```

- [ ] **Step 3: Executar a suite de testes unitários**

Certifique-se de que todos os testes do DashboardSaldos continuam passando normalmente.
Executar: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 4: Compilar o build de produção**

Verifique que os avisos do Vite em relação a chunks de import dinâmico duplicados foram eliminados.
Executar: `npm run build`
Expected: PASS (com zero avisos de chunk duplicado para esses repositórios!)

- [ ] **Step 5: Commitar a refatoração do DashboardSaldos**

Grave as simplificações no repositório local.
Executar:
```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "refactor: remover imports assincronos dinamicos em DashboardSaldos reduzindo complexidade e resolvendo avisos do Vite"
```
