# Ocultar Barra de Navegação durante BottomSheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir que a barra de navegação inferior desapareça quando qualquer painel (BottomSheet) estiver aberto, melhorando o foco e evitando sobreposições.

**Architecture:** Utilizaremos o estado global `isAnyBottomSheetOpen` do composable `useBottomSheetState` para controlar a renderização condicional (`v-if`) do componente `BottomTabBar` no `App.vue`.

**Tech Stack:** Vue 3 (Composition API), Vitest, Tailwind CSS.

---

### Task 1: Adicionar teste de regressão para a barra de navegação

**Files:**
- Modify: `src/App.test.ts`

- [ ] **Step 1: Atualizar o mock de `useBottomSheetState` para ser controlável**

```typescript
// No topo do arquivo, crie uma variável para o estado
const isAnyBottomSheetOpenMock = ref(false)

// Atualize o mock
vi.mock('./composables/useBottomSheetState', () => ({
  useBottomSheetState: () => ({
    isAnyBottomSheetOpen: isAnyBottomSheetOpenMock,
  }),
}))
```

- [ ] **Step 2: Adicionar o caso de teste para ocultar a barra de navegação**

```typescript
describe('App Navigation', () => {
  it('esconde a BottomTabBar quando um BottomSheet está aberto', async () => {
    isAnyBottomSheetOpenMock.value = false
    const wrapper = mount(App, {
      global: {
        stubs: {
          DashboardSaldos: true,
          NovoLancamentoWizard: true,
          ConfiguracoesMembros: true,
          BottomSheet: true,
          BottomTabBar: true
        },
      },
    })

    expect(wrapper.findComponent({ name: 'BottomTabBar' }).exists()).toBe(true)

    isAnyBottomSheetOpenMock.value = true
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent({ name: 'BottomTabBar' }).exists()).toBe(false)
  })
})
```

- [ ] **Step 3: Rodar o teste para confirmar que falha**

Run: `npx vitest run src/App.test.ts`
Expected: FAIL (o componente continuará existindo pois ainda não tem v-if)

- [ ] **Step 4: Commit do teste falho**

```bash
git add src/App.test.ts
git commit -m "test: add test case for hiding navigation bar when bottom sheet is open"
```

---

### Task 2: Implementar renderização condicional da barra de navegação

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Aplicar `v-if` no componente `BottomTabBar`**

Localize o componente `<BottomTabBar />` no final do template e adicione a condição:

```html
<BottomTabBar v-if="!isAnyBottomSheetOpen" v-model="activeTab" />
```

- [ ] **Step 2: Rodar os testes para confirmar que agora passam**

Run: `npx vitest run src/App.test.ts`
Expected: PASS

- [ ] **Step 3: Commit da implementação**

```bash
git add src/App.vue
git commit -m "feat: hide bottom tab bar when any bottom sheet is open"
```

---

### Task 4: Cleanup e Verificação Final

- [ ] **Step 1: Remover arquivos temporários**

```bash
rm start-visual-companion.ps1
```

- [ ] **Step 2: Verificar se não há outros erros de lint**

Run: `npm run lint` (ou comando equivalente do projeto)

- [ ] **Step 3: Commit final**

```bash
git add .
git commit -m "chore: cleanup temporary scripts"
```
