# Limpeza de Código Morto e Correção de Reembolsos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Purificar o repositório de arquivos fantasmas de depuração e corrigir as falhas de tipos/referência que impedem a execução dos testes automatizados de reembolso e fechamento de fatura.

**Architecture:** Excluiremos fisicamente arquivos js ad-hoc no backend e faremos correções pontuais e injeção de mocks necessários no frontend para fazer a suíte de testes Vitest passar de ponta a ponta.

**Tech Stack:** TypeScript, Vue, Vitest, PowerShell.

---

### Task 1: Remover arquivos fantasmas no backend

**Files:**
- [DELETE] `backend/scratch_debug.js`
- [DELETE] `backend/scratch_debug_short.js`
- [DELETE] `backend/test_admin_api.js`
- [DELETE] `backend/test_e2e_rest.js`

- [ ] **Step 1: Remover os 4 arquivos obsoletos do disco**
  Remover os arquivos fisicamente da raiz do diretório `backend`.

- [ ] **Step 2: Confirmar status de remoção**
  Executar: `git status`
  Verificar se os 4 arquivos aparecem como deletados e nenhum arquivo novo indesejado foi modificado.

- [ ] **Step 3: Commit da remoção**
  Executar:
  ```bash
  git add backend/scratch_debug.js backend/scratch_debug_short.js backend/test_admin_api.js backend/test_e2e_rest.js
  git commit -m "chore: remover arquivos fantasmas de debug do backend"
  ```

---

### Task 2: Corrigir a referência cega em `AcertoService`

**Files:**
- Modify: `src/models/services/AcertoService.ts`
- Test: `src/models/services/AcertoService.test.ts`

- [ ] **Step 1: Verificar a falha atual nos testes**
  Executar: `npx vitest run src/models/services/AcertoService.test.ts`
  Esperado: Falha com `ReferenceError: fatura is not defined` na linha 20.

- [ ] **Step 2: Adicionar a busca da fatura pelo repositório no método `registrarReembolsoMembro`**
  Modificar o arquivo `src/models/services/AcertoService.ts` para que a linha 20 faça a busca por `buscarPorId`:
  ```typescript
  async registrarReembolsoMembro(acertoId: string, valor: Dinheiro, data: Date = new Date()): Promise<void> {
    const acerto = await this.buscarEAtualizarAcerto(acertoId, valor, data)
    const fatura = await this.faturaRepo.buscarPorId(acerto.faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')
    
    await this.gerarGastoPixDeAcerto(acerto, fatura, valor)
    await this.sincronizarCarryover(acerto, fatura)

    await this.verificarEQuitarFatura(acerto.faturaId)
  }
  ```

- [ ] **Step 3: Executar testes de `AcertoService` para validar a correção**
  Executar: `npx vitest run src/models/services/AcertoService.test.ts`
  Esperado: Todos os testes em `AcertoService.test.ts` passam com sucesso.

- [ ] **Step 4: Commit da correção**
  Executar:
  ```bash
  git add src/models/services/AcertoService.ts
  git commit -m "fix: buscar fatura antes da validacao em registrarReembolsoMembro"
  ```

---

### Task 3: Ajustar mocks do `antecipacaoRepo` nos testes

**Files:**
- Modify: `src/models/services/FaturaService.test.ts`
- Modify: `src/viewmodels/useCartoesEFaturas.test.ts`

- [ ] **Step 1: Verificar a falha atual nos testes de `FaturaService`**
  Executar: `npx vitest run src/models/services/FaturaService.test.ts`
  Esperado: Falha em múltiplos testes com `TypeError: this.antecipacaoRepo.buscarPorFatura is not a function`.

- [ ] **Step 2: Corrigir inicialização do service nos testes de `FaturaService.test.ts`**
  Substituir as chamadas de inicialização do construtor de `FaturaService` no arquivo `src/models/services/FaturaService.test.ts` que usam `{} as any` para o quarto parâmetro.
  Antes:
  ```typescript
  const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any, {} as any)
  ```
  Depois:
  ```typescript
  const antecipacaoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]) }
  const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any, antecipacaoRepo as any)
  ```
  *(Nota: Aplicar isso especificamente nos testes das linhas 50, 78, 95, 190, 240, 288, 461, 472, 502, e 533).*

- [ ] **Step 3: Corrigir inicialização do service em `useCartoesEFaturas.test.ts`**
  Substituir na linha 118 de `src/viewmodels/useCartoesEFaturas.test.ts` a passagem de `{} as any` para usar um mock funcional:
  Antes:
  ```typescript
  const fSvc = new FaturaService(fRepo, aRepo, gRepo, {} as any)
  ```
  Depois:
  ```typescript
  const antRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]) } as any
  const fSvc = new FaturaService(fRepo, aRepo, gRepo, antRepo)
  ```

- [ ] **Step 4: Executar a suíte completa de testes no frontend**
  Executar: `npx vitest run`
  Esperado: Todos os 254 testes passam (0 falhas).

- [ ] **Step 5: Commit do ajuste de mocks**
  Executar:
  ```bash
  git add src/models/services/FaturaService.test.ts src/viewmodels/useCartoesEFaturas.test.ts
  git commit -m "test: ajustar injeção de mock do antecipacaoRepo nos testes do FaturaService"
  ```
