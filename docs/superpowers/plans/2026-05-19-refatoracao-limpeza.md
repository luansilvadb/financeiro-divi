# Refatoração e Limpeza da Base de Código: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limpar código morto e imports não utilizados de múltiplos arquivos do projeto Divi, além de reduzir a complexidade ciclomática das lógicas de período e mes em `DashboardSaldos.vue`, garantindo 100% de sucesso na suíte de testes e no build.

**Architecture:** Correção e remoção cirúrgica de referências não utilizadas reportadas pelo compilador TS, exposição de propriedades internas via `defineExpose` em componentes do Vue 3 para testes unitários, e refatoração aritmética linear de lógica de manipulação de meses/períodos.

**Tech Stack:** Vue 3 (Composition API / Script Setup), TypeScript, Vitest, Vue Test Utils.

---

### Task 1: Limpeza de Imports e Variáveis Mortas (Arquivos Auxiliares)

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/ledger/BottomSheetAjustarGasto.vue`
- Modify: `src/components/ledger/ConfiguracoesMembros.vue`

- [ ] **Step 1: Limpar imports mortos em `src/App.vue`**
  Remover a linha 6: `import Button from './components/ui/Button.vue'`.

- [ ] **Step 2: Limpar imports mortos em `src/components/ledger/BottomSheetAjustarGasto.vue`**
  Remover a linha 7: `import SectionLabel from '../ui/SectionLabel.vue'`.

- [ ] **Step 3: Limpar imports mortos em `src/components/ledger/ConfiguracoesMembros.vue`**
  Modificar a linha 4 para remover a importação não utilizada de `UserPlus`:
  ```typescript
  import { UserMinus, UserCheck, Users, CreditCard } from 'lucide-vue-next'
  ```

- [ ] **Step 4: Executar verificação de build temporária**
  Rodar: `npm run build`
  Expected: O build ainda falhará em `BottomSheetAcertoCompensacao.vue` e `DashboardSaldos.vue`, mas não mais nos arquivos ajustados nesta Task.

- [ ] **Step 5: Commit**
  ```bash
  git add src/App.vue src/components/ledger/BottomSheetAjustarGasto.vue src/components/ledger/ConfiguracoesMembros.vue
  git commit -m "refactor: limpa imports e declaracoes nao utilizadas em App, AjustarGasto e ConfiguracoesMembros"
  ```

---

### Task 2: Correção de Tipos e Exposição de Referências em `BottomSheetAcertoCompensacao`

**Files:**
- Modify: `src/components/ledger/dashboard/BottomSheetAcertoCompensacao.vue`
- Modify: `src/components/ledger/dashboard/BottomSheetAcertoCompensacao.test.ts`

- [ ] **Step 1: Expor `valorReal` no componente `BottomSheetAcertoCompensacao.vue`**
  Remover o import não utilizado de `SectionLabel` (linha 4) e adicionar `defineExpose` no script setup para expor o `valorReal`.
  Código a ser modificado de:
  ```typescript
  import { ref, watch } from 'vue'
  import Button from '../../ui/Button.vue'
  import SectionLabel from '../../ui/SectionLabel.vue'
  import { Wallet, Banknote, RefreshCcw } from 'lucide-vue-next'
  ```
  para:
  ```typescript
  import { ref, watch } from 'vue'
  import Button from '../../ui/Button.vue'
  import { Wallet, Banknote, RefreshCcw } from 'lucide-vue-next'
  ```
  E adicionar ao final do script (após a linha 41):
  ```typescript
  defineExpose({
    valorReal
  })
  ```

- [ ] **Step 2: Ajustar o teste unitário `BottomSheetAcertoCompensacao.test.ts`**
  Modificar o import para remover `vi` e aplicar o cast no wrapper para evitar erro de tipo do TS.
  Modificar de:
  ```typescript
  import { describe, it, expect, vi } from 'vitest'
  ```
  para:
  ```typescript
  import { describe, it, expect } from 'vitest'
  ```
  E modificar a linha 26 de:
  ```typescript
  expect(wrapper.vm.valorReal).toBe(150.50)
  ```
  para:
  ```typescript
  expect((wrapper.vm as any).valorReal).toBe(150.50)
  ```

- [ ] **Step 3: Executar teste unitário para validar funcionamento**
  Rodar: `npx vitest run src/components/ledger/dashboard/BottomSheetAcertoCompensacao.test.ts`
  Expected: PASS

- [ ] **Step 4: Executar build geral para verificar erros pendentes**
  Rodar: `npm run build`
  Expected: Falhar apenas em `DashboardSaldos.vue`.

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/ledger/dashboard/BottomSheetAcertoCompensacao.vue src/components/ledger/dashboard/BottomSheetAcertoCompensacao.test.ts
  git commit -m "refactor: corrige import e erro de tipo no teste do BottomSheetAcertoCompensacao"
  ```

---

### Task 3: Refatoração e Redução de Complexidade Ciclomática em `DashboardSaldos.vue`

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Limpar variáveis mortas do Script Setup**
  1. Remover `sugerirProximoPeriodo,` da desestruturação de `calculations` (linha 218).
  2. Remover `const getCartaoNome = (cartaoId: string) => getCartaoNomeBase(props.cartoes, cartaoId)` (linhas 222-223).
  3. Remover a linha 294: `const { isMonthLocked } = useFaturaRollover()`.

- [ ] **Step 2: Refatorar lógica de `obterPeriodoInicial`**
  Substituir a cascata de ifs por um fluxo linear.
  Código modificado de:
  ```typescript
  const obterPeriodoInicial = () => {
    const salvo = localStorage.getItem('divi_periodo_selecionado')
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo)
        if (parsed.mes && parsed.ano) return parsed
      } catch(e) {}
    }
    if (props.faturasAbertas && props.faturasAbertas.length > 0) {
      const fat = props.faturasAbertas[0]
      return { mes: fat.periodo.mes, ano: fat.periodo.ano }
    }
    if (props.faturasFechadas && props.faturasFechadas.length > 0) {
      const fat = props.faturasFechadas[0]
      return { mes: fat.periodo.mes, ano: fat.periodo.ano }
    }
    return { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() }
  }
  ```
  para:
  ```typescript
  const obterPeriodoInicial = () => {
    const salvo = localStorage.getItem('divi_periodo_selecionado')
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo)
        if (parsed.mes && parsed.ano) return parsed
      } catch (e) {}
    }
    const faturaReferencia = props.faturasAbertas?.[0] || props.faturasFechadas?.[0]
    if (faturaReferencia?.periodo) {
      return { mes: faturaReferencia.periodo.mes, ano: faturaReferencia.periodo.ano }
    }
    return { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() }
  }
  ```

- [ ] **Step 3: Refatorar seletor de meses `listaMesesSeletor`**
  Simplificar a manipulação aritmética de meses usando o objeto `Date` nativo, reduzindo branches e mutações complexas em loop.
  Código modificado de:
  ```typescript
  const listaMesesSeletor = computed(() => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const hoje = new Date()
    const mesAtual = hoje.getMonth() + 1
    const anoAtual = hoje.getFullYear()
    
    const list = []
    
    // Vamos gerar os últimos 24 meses (2 anos), o atual e os próximos 24 meses (2 anos)
    let tempMes = mesAtual - 24
    let tempAno = anoAtual
    while (tempMes <= 0) {
      tempMes += 12
      tempAno -= 1
    }
    
    for (let i = 0; i < 49; i++) {
      const mesIdx = tempMes
      const anoIdx = tempAno
      
      const estaFechada = props.faturasFechadas.some(f => f.periodo.mes === mesIdx && f.periodo.ano === anoIdx)
      
      list.push({
        mes: mesIdx,
        ano: anoIdx,
        nome: `${meses[mesIdx - 1]} ${anoIdx}`,
        status: estaFechada ? 'FECHADA' : 'ABERTA'
      })
      
      tempMes++
      if (tempMes > 12) {
        tempMes = 1
        tempAno++
      }
    }
    
    return list
  })
  ```
  para:
  ```typescript
  const listaMesesSeletor = computed(() => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const hoje = new Date()
    const list = []

    for (let i = -24; i <= 24; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
      const mesIdx = d.getMonth() + 1
      const anoIdx = d.getFullYear()
      
      const estaFechada = props.faturasFechadas.some(
        f => f.periodo.mes === mesIdx && f.periodo.ano === anoIdx
      )

      list.push({
        mes: mesIdx,
        ano: anoIdx,
        nome: `${meses[mesIdx - 1]} ${anoIdx}`,
        status: estaFechada ? 'FECHADA' : 'ABERTA'
      })
    }

    return list
  })
  ```

- [ ] **Step 4: Refatorar computed `faturaAtivaVisualizada`**
  Expressar a busca utilizando métodos declarativos.
  Código modificado de:
  ```typescript
  const faturaAtivaVisualizada = computed(() => {
    const p = periodoSelecionado.value
    const real = props.faturasAbertas.find(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano) ||
                 props.faturasFechadas.find(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
    if (real) return real

    return new Fatura({
      id: `virtual-${p.mes}-${p.ano}`,
      cartaoId: props.cartoes[0]?.id || 'virtual-card',
      periodo: { mes: p.mes, ano: p.ano },
      responsavelId: props.membros[0]?.id || 'virtual-member',
      status: 'ABERTA'
    })
  })
  ```
  para:
  ```typescript
  const faturaAtivaVisualizada = computed(() => {
    const p = periodoSelecionado.value
    const faturaEncontrada = props.faturasAbertas.find(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano) ||
                             props.faturasFechadas.find(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
    if (faturaEncontrada) return faturaEncontrada

    return new Fatura({
      id: `virtual-${p.mes}-${p.ano}`,
      cartaoId: props.cartoes[0]?.id || 'virtual-card',
      periodo: { mes: p.mes, ano: p.ano },
      responsavelId: props.membros[0]?.id || 'virtual-member',
      status: 'ABERTA'
    })
  })
  ```

- [ ] **Step 5: Executar suíte de testes unitários**
  Rodar: `npx vitest run`
  Expected: Todos os 130 testes passam sem problemas.

- [ ] **Step 6: Validar compilação geral do TypeScript**
  Rodar: `npm run build`
  Expected: O build compila com sucesso sem qualquer erro.

- [ ] **Step 7: Commit**
  ```bash
  git add src/components/ledger/DashboardSaldos.vue
  git commit -m "refactor: simplifica obterPeriodoInicial, listaMesesSeletor e faturaAtivaVisualizada em DashboardSaldos"
  ```
