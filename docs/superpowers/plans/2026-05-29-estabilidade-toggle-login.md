# Estabilidade do Toggle de Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estabilizar o botão e os inputs de criação de login na tela de configurações de membros para evitar flickers de layout e cliques perdidos por reconstrução de DOM, otimizando tanto para desktop quanto para gestos de toque no mobile.

**Architecture:** Substituição dos botões condicionais baseados em `v-if`/`v-else` por um único botão reativo estável, e dos inputs por um container persistente baseado em `v-show` e estado `:disabled` reativo. Aplicação de propriedades CSS de Toque no mobile e filtro matemático de toques rápidos baseados em timestamp (`Date.now()`).

**Tech Stack:** Vue 3, Vitest, TailwindCSS.

---

### Task 1: Unificar Botões e Estabilizar Inputs (Concluído)
- [x] Step 1: Modificar ConfiguracoesMembros.vue
- [x] Step 2: Rodar os testes existentes
- [x] Step 3: Adicionar teste específico para o toggle
- [x] Step 4: Rodar novamente os testes
- [x] Step 5: Commit

---

### Task 2: Aplicar Otimizações de Toque CSS para Mobile (Concluído)
- [x] Step 1: Modificar o botão em ConfiguracoesMembros.vue
- [x] Step 2: Rodar todos os testes de unidade para garantir que continuam passando
- [x] Step 3: Commit

---

### Task 3: Sincronização de Visibilidade por Frame de Tela (requestAnimationFrame) (Concluído / Substituído pela Task 4)
- [x] Step 1: Adicionar toggleCredenciais no script de ConfiguracoesMembros.vue
- [x] Step 2: Atualizar chamada de clique no template de ConfiguracoesMembros.vue
- [x] Step 3: Atualizar teste de unidade em ConfiguracoesMembros.test.ts
- [x] Step 4: Rodar todos os testes do projeto
- [x] Step 5: Commit

---

### Task 4: Debouncing Nativo por Timestamp (Filtro de Cliques Rápidos)

**Files:**
- Modify: `d:/projetos/divi/src/views/screens/ConfiguracoesMembros.vue`
- Test: `d:/projetos/divi/src/views/screens/ConfiguracoesMembros.test.ts`

- [ ] **Step 1: Atualizar toggleCredenciais no script de ConfiguracoesMembros.vue**

Substituir o bloqueio baseado em frame (`requestAnimationFrame`) por um filtro baseado em data real (`Date.now()`) de 250ms.

Código a ser modificado (em torno da linha 30):
```typescript
let ultimoClique = 0
const toggleCredenciais = () => {
  const agora = Date.now()
  if (agora - ultimoClique < 250) return
  ultimoClique = agora
  mostrarCredenciais.value = !mostrarCredenciais.value
}
```

- [ ] **Step 2: Rodar testes locais**

Run: `npx vitest run src/views/screens/ConfiguracoesMembros.test.ts`
Expected: PASS.

- [ ] **Step 3: Rodar todos os testes do projeto**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 4: Commit**

Run: `git add src/views/screens/ConfiguracoesMembros.vue`
Run: `git commit -m "perf: implement hardware-like input debouncing on credentials toggle"`
