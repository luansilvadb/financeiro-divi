# Plano de Implementação: Acessibilidade de Teclado no Seletor de Períodos

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o seletor de períodos (dropdown de períodos abertos e lista de meses arquivados) no BottomSheet de Histórico do `DashboardSaldos.vue` 100% acessível via navegação de teclado e leitores de tela.

**Architecture:** Atualizar a marcação HTML com tags semânticas ARIA adequadas, diretivas de acessibilidade de foco do Vue (`tabindex`, `role`, `aria-expanded`) e manipuladores de teclado para eventos `keydown.enter` e `keydown.space`.

**Tech Stack:** Vue 3, TailwindCSS (classes existentes), Vitest, @vue/test-utils.

---

### Task 1: Acessibilidade do Acionador do Dropdown de Meses Abertos

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue` (linhas 920-942)

- [ ] **Step 1: Modificar a marcação do acionador do dropdown**
Alterar o elemento acionador do dropdown de meses abertos adicionando foco de teclado, semântica ARIA e tratamento das teclas `Enter` e `Space`.

Substituir o bloco existente:
```vue
          <div class="relative" tabindex="0" @blur="isDropdownAbertosOpen = false">
            <div 
              @click="isDropdownAbertosOpen = !isDropdownAbertosOpen"
              class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm cursor-pointer select-none flex justify-between items-center"
              :class="isDropdownAbertosOpen ? 'border-ember ring-2 ring-ember/20' : ''"
            >
```

Por:
```vue
          <div class="relative" @blur="isDropdownAbertosOpen = false">
            <div 
              @click="isDropdownAbertosOpen = !isDropdownAbertosOpen"
              @keydown.enter.prevent="isDropdownAbertosOpen = !isDropdownAbertosOpen"
              @keydown.space.prevent="isDropdownAbertosOpen = !isDropdownAbertosOpen"
              role="button"
              tabindex="0"
              :aria-expanded="isDropdownAbertosOpen.toString()"
              aria-haspopup="listbox"
              aria-label="Gerenciar período aberto"
              class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm cursor-pointer select-none flex justify-between items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2"
              :class="isDropdownAbertosOpen ? 'border-ember ring-2 ring-ember/20' : ''"
            >
```
*(Nota: O `tabindex="0"` foi movido do contêiner externo para a div interna clicável para que o foco do teclado caia no elemento interativo correto).*

- [ ] **Step 2: Commit parcial**
```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "feat(ledger): add keyboard accessibility to open period dropdown trigger"
```

---

### Task 2: Acessibilidade das Opções do Dropdown de Meses Abertos

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue` (linhas 948-961)

- [ ] **Step 1: Atualizar as opções de meses abertos no loop v-for**
Atualizar o contêiner de cada opção do dropdown de meses abertos para ser focalizável por teclado, semântico e escutar eventos `keydown.enter` e `keydown.space`.

Substituir o bloco:
```vue
                <div 
                  v-for="op in mesesAbertosOpcoes" 
                  :key="op.nome" 
                  :ref="el => setItemSelecionadoRef(el, op)"
                  @mousedown.prevent="periodoSelecionado = { mes: op.mes, ano: op.ano }; isDropdownAbertosOpen = false; showBottomSheetHistorico = false" 
                  class="px-4 py-3 text-sm font-medium hover:bg-stone cursor-pointer transition-colors flex items-center gap-3"
                  :class="periodoSelecionado.mes === op.mes && periodoSelecionado.ano === op.ano ? 'text-ember bg-ember/5 is-selected' : 'text-charcoal'"
                >
```

Por:
```vue
                <div 
                  v-for="op in mesesAbertosOpcoes" 
                  :key="op.nome" 
                  :ref="el => setItemSelecionadoRef(el, op)"
                  @mousedown.prevent="periodoSelecionado = { mes: op.mes, ano: op.ano }; isDropdownAbertosOpen = false; showBottomSheetHistorico = false" 
                  @keydown.enter.prevent="periodoSelecionado = { mes: op.mes, ano: op.ano }; isDropdownAbertosOpen = false; showBottomSheetHistorico = false"
                  @keydown.space.prevent="periodoSelecionado = { mes: op.mes, ano: op.ano }; isDropdownAbertosOpen = false; showBottomSheetHistorico = false"
                  role="button"
                  tabindex="0"
                  class="px-4 py-3 text-sm font-medium hover:bg-stone cursor-pointer transition-colors flex items-center gap-3 focus:outline-none focus:bg-stone"
                  :class="periodoSelecionado.mes === op.mes && periodoSelecionado.ano === op.ano ? 'text-ember bg-ember/5 is-selected' : 'text-charcoal'"
                >
```

- [ ] **Step 2: Commit parcial**
```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "feat(ledger): add keyboard support and aria role to open period dropdown items"
```

---

### Task 3: Acessibilidade dos Meses Arquivados (Fechados)

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue` (linhas 970-988)

- [ ] **Step 1: Atualizar itens do histórico de arquivados no loop v-for**
Atualizar a lista de meses arquivados para suportar navegação e ativação por teclado, adicionando também uma descrição de áudio apropriada (aria-label).

Substituir o bloco:
```vue
            <div 
              v-for="item in mesesTrancadosOpcoes" 
              :key="item.nome"
              @click="periodoSelecionado = { mes: item.mes, ano: item.ano }; showBottomSheetHistorico = false"
              class="p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between"
              :class="periodoSelecionado.mes === item.mes && periodoSelecionado.ano === item.ano ? 'border-ember bg-ember/5 text-ember font-bold' : 'border-stone bg-canvas hover:border-ember/30 text-charcoal'"
            >
```

Por:
```vue
            <div 
              v-for="item in mesesTrancadosOpcoes" 
              :key="item.nome"
              @click="periodoSelecionado = { mes: item.mes, ano: item.ano }; showBottomSheetHistorico = false"
              @keydown.enter.prevent="periodoSelecionado = { mes: item.mes, ano: item.ano }; showBottomSheetHistorico = false"
              @keydown.space.prevent="periodoSelecionado = { mes: item.mes, ano: item.ano }; showBottomSheetHistorico = false"
              role="button"
              tabindex="0"
              :aria-label="`Selecionar período arquivado ${item.nome}`"
              class="p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2"
              :class="periodoSelecionado.mes === item.mes && periodoSelecionado.ano === item.ano ? 'border-ember bg-ember/5 text-ember font-bold' : 'border-stone bg-canvas hover:border-ember/30 text-charcoal'"
            >
```

- [ ] **Step 2: Commit parcial**
```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "feat(ledger): add keyboard accessibility and aria labels to archived months list"
```

---

### Task 4: Testagem Unitária e Verificação Geral

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.test.ts`
- Test run command: `npx vitest run`

- [ ] **Step 1: Adicionar testes de acessibilidade no arquivo de testes**
Inserir testes específicos em `DashboardSaldos.test.ts` para testar os atributos de acessibilidade criados e o tratamento de eventos via teclado.

Adicionar o seguinte bloco de testes ao final do arquivo `src/components/ledger/DashboardSaldos.test.ts` antes do fechamento do `describe` principal (após a linha 152):
```typescript
  it('deve possuir atributos de acessibilidade e suportar eventos de teclado no seletor de períodos', async () => {
    const faturasFechadasMock = [
      { id: 'f2', cartaoId: 'c1', responsavelId: 'm1', status: 'FECHADA', periodo: { mes: 4, ano: 2026 } }
    ] as any

    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [{ id: 'm1', nome: 'João' }, { id: 'm2', nome: 'Maria' }],
        faturasFechadas: faturasFechadasMock,
        acertosPendentes: [],
        faturasAbertas: [
          { id: 'f1', cartaoId: 'c1', responsavelId: 'm1', status: 'ABERTA', periodo: { mes: 5, ano: 2026 } }
        ] as any,
        cartoes: [{ id: 'c1', nome: 'Nubank' }] as any,
        calcularConsumo: () => 0
      }
    })

    // Abre o BottomSheet de historico para renderizar os seletores
    await wrapper.setData({ showBottomSheetHistorico: true })
    await wrapper.vm.$nextTick()

    // 1. Testa acionador do dropdown de abertos
    const trigger = wrapper.find('[aria-label="Gerenciar período aberto"]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('role')).toBe('button')
    expect(trigger.attributes('tabindex')).toBe('0')
    expect(trigger.attributes('aria-expanded')).toBe('false')

    // Ativa dropdown via Enter
    await trigger.trigger('keydown.enter')
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.isDropdownAbertosOpen).toBe(true)
    expect(trigger.attributes('aria-expanded')).toBe('true')

    // 2. Testa itens do dropdown de meses abertos
    const openItems = wrapper.findAll('[role="button"]')
    const openPeriodOption = openItems.find(item => item.text().includes('Maio 2026'))
    expect(openPeriodOption?.exists()).toBe(true)
    expect(openPeriodOption?.attributes('tabindex')).toBe('0')

    // 3. Testa itens de meses arquivados
    const archivedItem = wrapper.find('[aria-label="Selecionar período arquivado Abril 2026"]')
    expect(archivedItem.exists()).toBe(true)
    expect(archivedItem.attributes('role')).toBe('button')
    expect(archivedItem.attributes('tabindex')).toBe('0')

    // Seleciona período arquivado via Teclado (Space)
    await archivedItem.trigger('keydown.space')
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.periodoSelecionado.mes).toBe(4)
    expect(wrapper.vm.periodoSelecionado.ano).toBe(2026)
    expect(wrapper.vm.showBottomSheetHistorico).toBe(false)
  })
```

- [ ] **Step 2: Executar testes unitários**
Executar todos os testes do projeto para garantir que as alterações de acessibilidade estão corretas e nenhum outro teste quebrou.
Rodar: `npx vitest run`
Esperado: Todos os testes passando (31 test files, 109 tests).

- [ ] **Step 3: Commit final**
```bash
git add src/components/ledger/DashboardSaldos.test.ts
git commit -m "test(ledger): add keyboard accessibility tests for period selectors"
```
