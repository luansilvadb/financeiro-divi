# Estabilidade do Toggle de Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estabilizar o botão e os inputs de criação de login na tela de configurações de membros para evitar flickers de layout e cliques perdidos por reconstrução de DOM, otimizando tanto para desktop quanto para gestos de toque no mobile.

**Architecture:** Substituição dos botões condicionais baseados em `v-if`/`v-else` por um único botão reativo estável, e dos inputs por um container persistente baseado em `v-show` e estado `:disabled` reativo. Aplicação de propriedades CSS de Toque no mobile e limitação de taxa por frame de tela (`requestAnimationFrame`).

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

### Task 3: Sincronização de Visibilidade por Frame de Tela (requestAnimationFrame)

**Files:**
- Modify: `d:/projetos/divi/src/views/screens/ConfiguracoesMembros.vue`
- Test: `d:/projetos/divi/src/views/screens/ConfiguracoesMembros.test.ts`

- [ ] **Step 1: Adicionar toggleCredenciais no script de ConfiguracoesMembros.vue**

Definir a variável de controle `alternandoCredenciais` e a função `toggleCredenciais` no script do componente.

Código a ser adicionado (em torno da linha 30):
```typescript
let alternandoCredenciais = false
const toggleCredenciais = () => {
  if (alternandoCredenciais) return
  alternandoCredenciais = true
  mostrarCredenciais.value = !mostrarCredenciais.value
  requestAnimationFrame(() => {
    alternandoCredenciais = false
  })
}
```

- [ ] **Step 2: Atualizar chamada de clique no template de ConfiguracoesMembros.vue**

Substituir `@click="mostrarCredenciais = !mostrarCredenciais"` por `@click="toggleCredenciais"`.

Código a ser modificado (em torno da linha 156):
```html
                <button 
                  @click="toggleCredenciais"
                  class="text-[10px] font-bold uppercase tracking-widest hover:underline transition-colors duration-150 select-none [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                  :class="mostrarCredenciais ? 'text-ash' : 'text-ember'"
                >
                  {{ mostrarCredenciais ? 'Remover Login' : '+ Criar Login' }}
                </button>
```

- [ ] **Step 3: Atualizar teste de unidade em ConfiguracoesMembros.test.ts**

No teste unitário criado na Task 1, precisamos garantir que o clique use o fluxo correto do `toggleCredenciais` e que não quebre devido ao `requestAnimationFrame`. No ambiente de testes do Vitest, o `requestAnimationFrame` precisa ser executado (geralmente executado de forma síncrona no ambiente JSDOM, mas caso contrário, podemos precisar limpar timers ou apenas simular o clique).

Rodar os testes para verificar o comportamento:
Run: `npx vitest run src/views/screens/ConfiguracoesMembros.test.ts`
Expected: PASS.

- [ ] **Step 4: Rodar todos os testes do projeto**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/views/screens/ConfiguracoesMembros.vue`
Run: `git commit -m "perf: synchronize login toggle with screen rendering frame"`
