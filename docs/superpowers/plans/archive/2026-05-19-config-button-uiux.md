# Evolução UI/UX do Botão de Configuração - Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evoluir a UI/UX do botão de configurações no cabeçalho do DashboardSaldos para ser um ícone minimalista de 24px sem bordas ou fundo, que muda de cor para Ember no hover de forma integrada.

**Architecture:** O botão de configurações em `DashboardSaldos.vue` será reestruturado de uma caixa cinza com borda sólida para um botão transparente com largura/altura de 44px (touch target recomendado para mobile) e o ícone lucide `Settings` em seu interior com tamanho ajustado para 24px (`w-6 h-6`). O botão usará a classe `group` e o ícone usará `group-hover:text-ember` para transicionar a cor do ícone de `text-ash` para `text-ember` sem rotação ou mudança espacial no hover.

**Tech Stack:** Vue 3, Tailwind CSS v4, Lucide Vue Next, Vitest.

---

### Task 1: Adicionar teste unitário de emissão do evento openSettings e acessibilidade

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.test.ts`

- [ ] **Step 1: Escrever teste de regressão/cobertura**
  Adicionar no final do arquivo de testes `src/components/ledger/DashboardSaldos.test.ts` (antes do último bloco de fechamento `describe`) o seguinte teste para garantir o funcionamento do botão e seus atributos de acessibilidade:
  ```typescript
  it('deve disparar openSettings ao clicar no botão de configurações e possuir atributos de acessibilidade', async () => {
    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [],
        faturasAbertas: [],
        faturasFechadas: [],
        acertosPendentes: [],
        cartoes: [],
        calcularConsumo: () => 0
      }
    })

    const configButton = wrapper.find('[aria-label="Configurações"]')
    expect(configButton.exists()).toBe(true)
    expect(configButton.attributes('title')).toBe('Configurações')
    
    await configButton.trigger('click')
    expect(wrapper.emitted('openSettings')).toBeTruthy()
  })
  ```

- [ ] **Step 2: Executar testes para validar que passam inicialmente**
  Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
  Expected: PASS (pois o botão original já tem aria-label e emite o evento)

- [ ] **Step 3: Commit do teste**
  ```bash
  git add src/components/ledger/DashboardSaldos.test.ts
  git commit -m "test: adicionar teste unitário para o botão de configurações"
  ```

---

### Task 2: Modificar a UI do botão de configurações no DashboardSaldos

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Substituir a estrutura do botão antigo pela nova especificação minimalista**
  Substituir o bloco de código correspondente na coluna direita do header (linhas 483-490) em `src/components/ledger/DashboardSaldos.vue`:
  
  Código Original:
  ```vue
      <!-- Coluna Direita: Ações (Settings) -->
      <div class="flex-1 flex justify-end">
        <button 
          @click="$emit('openSettings')" 
          class="w-11 h-11 bg-stone/30 hover:bg-stone/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 rounded-2xl flex items-center justify-center transition-colors border border-stone/20"
          aria-label="Configurações"
          title="Configurações"
        >
          <Settings class="w-5 h-5 text-graphite" />
        </button>
      </div>
  ```

  Código Novo:
  ```vue
      <!-- Coluna Direita: Ações (Settings) -->
      <div class="flex-1 flex justify-end">
        <button 
          @click="$emit('openSettings')" 
          class="w-11 h-11 bg-transparent hover:bg-transparent border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 rounded-xl flex items-center justify-center transition-all group"
          aria-label="Configurações"
          title="Configurações"
        >
          <Settings class="w-6 h-6 text-ash group-hover:text-ember transition-colors duration-200" />
        </button>
      </div>
  ```

- [ ] **Step 2: Executar testes unitários do componente**
  Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
  Expected: PASS

- [ ] **Step 3: Executar a suite completa de testes do projeto**
  Run: `npx vitest run`
  Expected: PASS (todas as frentes de teste integras)

- [ ] **Step 4: Commit das alterações**
  ```bash
  git add src/components/ledger/DashboardSaldos.vue
  git commit -m "feat: evoluir visual do botão de configurações para ícone minimalista de 24px com hover ember"
  ```
