# Pré-seleção Automática em Contas Fixas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir que ao lançar uma conta fixa, o sistema selecione automaticamente todos os moradores se a lista de divisão do template estiver vazia ou incompatível com os moradores atuais.

**Architecture:** Modificação da lógica de inicialização no componente `PopupLancarContaFixa.vue` através do `watch` da prop `bill`. Adição de testes de regressão para validar os cenários de IDs compatíveis e incompatíveis.

**Tech Stack:** Vue 3, Vitest, TypeScript.

---

### Task 1: Adicionar testes de regressão para pré-seleção

**Files:**
- Modify: `src/components/ledger/PopupLancarContaFixa.test.ts`

- [ ] **Step 1: Adicionar caso de teste para IDs compatíveis**

```typescript
it('seleciona apenas os IDs compatíveis do template quando existem na casa', async () => {
  const billWithMixedIds: ContaFixa = {
    ...bill,
    defaultSplit: ['luan', 'id-inexistente']
  }
  
  const wrapper = mount(PopupLancarContaFixa, {
    props: {
      visible: true,
      bill: billWithMixedIds,
      membros,
    },
  })

  // Atualmente isso falharia pois o código atual não filtra e não faz fallback
  // Mas vamos testar o comportamento esperado: deve ter fallback se a lista válida for insuficiente?
  // Pela spec: "Se a lista filtrada estiver vazia, preencher com todos".
  // Se tiver 'luan', ele deve marcar apenas 'luan'.
  
  const splitLuan = wrapper.find('[data-testid="split-luan"]')
  const splitMaria = wrapper.find('[data-testid="split-maria"]')
  
  expect(splitLuan.classes()).toContain('bg-white') // Selecionado
  expect(splitMaria.classes()).not.toContain('bg-white') // Não selecionado
})
```

- [ ] **Step 2: Adicionar caso de teste para fallback (IDs totalmente incompatíveis)**

```typescript
it('seleciona TODOS os moradores se nenhum ID do template for encontrado na casa', async () => {
  const billWithInvalidIds: ContaFixa = {
    ...bill,
    defaultSplit: ['id-1', 'id-2']
  }
  
  const wrapper = mount(PopupLancarContaFixa, {
    props: {
      visible: true,
      bill: billWithInvalidIds,
      membros,
    },
  })

  const splitLuan = wrapper.find('[data-testid="split-luan"]')
  const splitMaria = wrapper.find('[data-testid="split-maria"]')
  const splitJoao = wrapper.find('[data-testid="split-joao"]')
  
  expect(splitLuan.classes()).toContain('bg-white')
  expect(splitMaria.classes()).toContain('bg-white')
  expect(splitJoao.classes()).toContain('bg-white')
})
```

- [ ] **Step 3: Rodar os testes para confirmar que falham**

Run: `npx vitest run src/components/ledger/PopupLancarContaFixa.test.ts`
Expected: FAIL

- [ ] **Step 4: Commit do teste falho**

```bash
git add src/components/ledger/PopupLancarContaFixa.test.ts
git commit -m "test: add regression tests for fixed bill split pre-selection"
```

---

### Task 2: Implementar lógica de pré-seleção inteligente

**Files:**
- Modify: `src/components/ledger/PopupLancarContaFixa.vue`

- [ ] **Step 1: Atualizar o `watch` da prop `bill`**

Localize o `watch` e substitua a lógica de atribuição de `splitIds`:

```typescript
watch(() => props.bill, (newBill) => {
  if (newBill) {
    valorReal.value = newBill.fixedValue || 0
    compradorId.value = props.membros[0]?.id || ''
    
    // Filtra apenas os IDs que realmente existem na lista de membros atual
    const validSplitIds = newBill.defaultSplit.filter(id => 
      props.membros.some(m => m.id === id)
    )
    
    if (validSplitIds.length > 0) {
      splitIds.value = [...validSplitIds]
    } else {
      // Fallback: Se o template estiver vazio ou com IDs antigos, seleciona todo mundo
      splitIds.value = props.membros.map(m => m.id)
    }
  }
}, { immediate: true })
```

- [ ] **Step 2: Rodar os testes para confirmar que passam**

Run: `npx vitest run src/components/ledger/PopupLancarContaFixa.test.ts`
Expected: PASS

- [ ] **Step 3: Commit da implementação**

```bash
git add src/components/ledger/PopupLancarContaFixa.vue
git commit -m "feat: implement dynamic fallback to all members in fixed bill selection"
```
