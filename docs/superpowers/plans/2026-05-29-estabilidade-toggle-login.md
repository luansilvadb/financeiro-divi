# Estabilidade do Toggle de Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estabilizar o botão e os inputs de criação de login na tela de configurações de membros para evitar flickers de layout e cliques perdidos por reconstrução de DOM, otimizando tanto para desktop quanto para gestos de toque no mobile.

**Architecture:** Substituição dos botões condicionais baseados em `v-if`/`v-else` por um único botão reativo estável, e dos inputs por um container persistente baseado em `v-show` e estado `:disabled` reativo. Aplicação de propriedades CSS de Toque no mobile.

**Tech Stack:** Vue 3, Vitest, TailwindCSS.

---

### Task 1: Unificar Botões e Estabilizar Inputs (Concluído)

**Files:**
- Modify: `d:/projetos/divi/src/views/screens/ConfiguracoesMembros.vue`
- Test: `d:/projetos/divi/src/views/screens/ConfiguracoesMembros.test.ts`

- [x] **Step 1: Modificar ConfiguracoesMembros.vue**
- [x] **Step 2: Rodar os testes existentes**
- [x] **Step 3: Adicionar teste específico para o toggle**
- [x] **Step 4: Rodar novamente os testes**
- [x] **Step 5: Commit**

---

### Task 2: Aplicar Otimizações de Toque CSS para Mobile

**Files:**
- Modify: `d:/projetos/divi/src/views/screens/ConfiguracoesMembros.vue`

- [ ] **Step 1: Modificar o botão em ConfiguracoesMembros.vue**

Adicionar as classes Tailwind `select-none [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]` ao botão de toggle de credenciais.

Código a ser modificado (em torno da linha 155):
```html
                <button 
                  @click="mostrarCredenciais = !mostrarCredenciais"
                  class="text-[10px] font-bold uppercase tracking-widest hover:underline transition-colors duration-150 select-none [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                  :class="mostrarCredenciais ? 'text-ash' : 'text-ember'"
                >
                  {{ mostrarCredenciais ? 'Remover Login' : '+ Criar Login' }}
                </button>
```

- [ ] **Step 2: Rodar todos os testes de unidade para garantir que continuam passando**

Run: `npx vitest run src/views/screens/ConfiguracoesMembros.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

Run: `git add src/views/screens/ConfiguracoesMembros.vue`
Run: `git commit -m "style: optimize login toggle for mobile touch gestures"`
