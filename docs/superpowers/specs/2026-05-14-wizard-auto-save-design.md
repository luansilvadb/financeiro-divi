# Spec: Wizard Auto-save (Drafts)

**Status:** Proposed
**Author:** Gemini CLI
**Date:** 2026-05-14

## Goal
Implement a draft persistence mechanism for the `NovoLancamentoWizard` component to prevent data loss on page refresh or accidental closure.

## Context
DIVI aims for low friction. The "Novo Lancamento" wizard has 3 steps. Losing progress midway is a high-friction event.

## Design

### Persistence Storage
- **Mechanism:** `localStorage`
- **Key:** `divi_rascunho_novo_lancamento`

### State to Persist
- `step` (number)
- `valor` (number)
- `descricao` (string)
- `fonte_id` (string)
- `pagador_id` (string)
- `pagueiPorOutro` (boolean)
- `beneficiarios_selecionados` (string[])

### Logic

#### 1. Auto-save
A watcher will be implemented in `NovoLancamentoWizard.vue` that reacts to changes in any of the state variables mentioned above. Whenever a change occurs, the entire relevant state will be serialized to JSON and stored in `localStorage`.

#### 2. Restore
In the `onMounted` hook of the component, we will check for the existence of the `divi_rascunho_novo_lancamento` key. If found, it will be parsed and used to hydrate the component's reactive state. Basic validation/defaults will be applied to handle potentially corrupted or outdated schema.

#### 3. Clear on Success
When the `finalizar` function is called and the transaction is successfully processed, the `localStorage` key must be removed to prevent the wizard from starting with the old data next time.

## Verification Plan
- **Manual Test:** 
  1. Open wizard, fill some data.
  2. Refresh page.
  3. Verify data is restored.
  4. Complete wizard.
  5. Open wizard again.
  6. Verify it is empty (reset).
- **Automated Test:** (Optional for this task as it's a UI component logic change, but recommended if a test suite exists for this component).
