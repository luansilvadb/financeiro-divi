# Design Spec: Sincronização de Membros e Atualização de Saldos

**Data:** 2026-05-14
**Status:** Em Revisão
**Objetivo:** Garantir que o Wizard utilize os mesmos membros que o Dashboard e que o retorno à tela inicial reflita os lançamentos imediatamente.

## 1. Alterações Estruturais

### 1.1 Centralização de Membros (App.vue)
- A lista de membros oficial será mantida no `App.vue`.
- Esta lista será passada para o `NovoLancamentoWizard.vue` via props.
- Membros padrão: Luan (Você), Maria, João, Paula (conforme spec do Wizard).

### 1.2 Interface do Wizard (Props & Emits)
- **Props:** Adicionar `membros: { id: string; nome: string }[]`.
- **Emits:** O Wizard emitirá o objeto `Transacao` completo ao finalizar.

## 2. Fluxo de Persistência e Navegação

1. **Wizard:** Usuário clica em "Salvar".
2. **Wizard:** Executa `emit('salvar', transacao)`.
3. **App:** `handleSalvarTransacao` recebe a transação.
4. **App:** Chama `repository.salvar(t)` (Persistência no LocalStorage).
5. **App:** Chama `carregarTransacoes()` (Atualiza estado reativo).
6. **App:** Altera `currentView.value = 'dashboard'` (Navegação).

## 3. Definição de Pronto (DoR)
- [ ] Wizard exibe os mesmos membros definidos no App.
- [ ] O saldo no Dashboard é atualizado instantaneamente após salvar.
- [ ] O LocalStorage contém a nova transação após o retorno ao Dashboard.
- [ ] O Wizard é resetado para o estado inicial após o salvamento.
