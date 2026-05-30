# Descrição Readonly no Modal de Acerto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o campo de descrição do modal de acerto apenas para leitura, garantindo que o padrão gerado pelo sistema não seja alterado.

**Architecture:** Modificação direta no componente Vue para adicionar o atributo `readonly` e ajustar as classes de estilo para refletir o estado não-editável. Criação de um teste unitário para garantir a regressão.

**Tech Stack:** Vue 3, Vitest, Tailwind CSS.

---

### Task 1: Criar Teste Unitário de Regressão

**Files:**
- Create: `src/components/ledger/dashboard/ModalAcertoCompensacao.test.ts`

- [ ] **Step 1: Criar o arquivo de teste com a validação do campo readonly**

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ModalAcertoCompensacao from './ModalAcertoCompensacao.vue'

describe('ModalAcertoCompensacao', () => {
  it('deve ter o campo de descrição como readonly e com estilo de cursor default', () => {
    const wrapper = mount(ModalAcertoCompensacao, {
      props: {
        visible: true,
        suggestedValue: 100,
        fromName: 'Luan',
        toName: 'Maria'
      }
    })

    const inputDescricao = wrapper.find('input[type="text"]')
    
    // Verifica se o atributo readonly está presente
    expect(inputDescricao.attributes()).toHaveProperty('readonly')
    
    // Verifica se possui a classe de cursor default e não possui a de foco de edição
    expect(inputDescricao.classes()).toContain('cursor-default')
    expect(inputDescricao.classes()).not.toContain('focus:border-ember')
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run src/components/ledger/dashboard/ModalAcertoCompensacao.test.ts`
Expected: FAIL

- [ ] **Step 3: Commit do teste falho**

```bash
git add src/components/ledger/dashboard/ModalAcertoCompensacao.test.ts
git commit -m "test: add regression test for readonly description field"
```

---

### Task 2: Implementar Readonly no Componente

**Files:**
- Modify: `src/components/ledger/dashboard/ModalAcertoCompensacao.vue`

- [ ] **Step 1: Adicionar atributo readonly e ajustar classes CSS**

Localize o input da descrição e aplique as mudanças:

```html
<!-- De: -->
<input 
  v-model="descricao"
  type="text"
  class="w-full px-4 py-3 rounded-xl border border-stone bg-canvas outline-none font-bold text-sm text-charcoal focus:border-ember transition-all"
/>

<!-- Para: -->
<input 
  v-model="descricao"
  type="text"
  readonly
  class="w-full px-4 py-3 rounded-xl border border-stone bg-canvas outline-none font-bold text-sm text-charcoal cursor-default transition-all"
/>
```

- [ ] **Step 2: Rodar o teste para confirmar que passa**

Run: `npx vitest run src/components/ledger/dashboard/ModalAcertoCompensacao.test.ts`
Expected: PASS

- [ ] **Step 3: Commit da implementação**

```bash
git add src/components/ledger/dashboard/ModalAcertoCompensacao.vue
git commit -m "feat: make settlement description field readonly"
```
