# Correção de Erros de Compilação Pós-Purga

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver os 50 erros de compilação resultantes da limpeza do código, removendo variáveis não utilizadas, corrigindo assinaturas de serviços e ajustando referências no template.

**Architecture:** Correções cirúrgicas arquivo por arquivo para garantir que o build passe sem introduzir nova lógica.

**Tech Stack:** Vue 3, TypeScript, Vite.

---

### Task 1: Limpeza de variáveis e imports não utilizados em ViewModels e App.vue

**Files:**
- Modify: `src/App.vue`
- Modify: `src/viewmodels/useCartoesEFaturas.ts`
- Modify: `src/viewmodels/useDashboardViewModel.ts`
- Modify: `src/viewmodels/useCartoesEFaturas.test.ts`
- Modify: `src/viewmodels/useDashboardViewModel.test.ts`

- [ ] **Step 1: Remover `acertos` de `src/App.vue`**
- [ ] **Step 2: Remover `localFaturaRepo` de `src/viewmodels/useCartoesEFaturas.ts`**
- [ ] **Step 3: Ajustar `useDashboardNetting` em `src/viewmodels/useDashboardViewModel.ts` para passar Ref em vez de função**
- [ ] **Step 4: Remover imports não utilizados nos testes dos ViewModels**
- [ ] **Step 5: Corrigir instanciacão de `GastoService` e `FaturaService` nos testes**

### Task 2: Correção de Serviços e Repositórios

**Files:**
- Modify: `src/models/services/FaturaService.ts`
- Modify: `src/models/services/GastoService.ts`
- Modify: `src/models/services/LancamentoService.ts`
- Modify: `src/models/services/DashboardSaldoService.ts`
- Modify: `src/models/services/FaturaService.test.ts`
- Modify: `src/models/services/MembroService.test.ts`
- Modify: `src/models/repositories/http/HttpAntecipacaoFaturaRepository.ts`

- [ ] **Step 1: Remover imports e propriedades não utilizados em `FaturaService.ts`, `GastoService.ts`, `LancamentoService.ts` e `DashboardSaldoService.ts`**
- [ ] **Step 2: Corrigir testes de `FaturaService` e `MembroService` para novas assinaturas de construtor**
- [ ] **Step 3: Resolver imports ausentes em `HttpAntecipacaoFaturaRepository.ts` (provavelmente remover o arquivo se não for mais usado ou corrigir paths)**

### Task 3: Ajustes no Template e DashboardSaldos.vue

**Files:**
- Modify: `src/views/screens/DashboardSaldos.vue`

- [ ] **Step 1: Remover variáveis e métodos não utilizados e não existentes no ViewModel**

---

### Verificação Final

- [ ] **Executar `npx vue-tsc -b` e garantir 0 erros**
