# Design Spec: Gestão Dinâmica de Membros com Auditoria Histórica

**Data:** 2026-05-16
**Status:** Draft
**Tópico:** Desinficação de dados hardcoded e persistência de moradores

## 1. Visão Geral
Atualmente, a lista de membros (moradores) do DIVI está fixada no código (`App.vue`). Para que o sistema seja utilizável na vida real, é necessário permitir a adição, edição e remoção de membros, garantindo que o histórico de transações passadas permaneça íntegro mesmo quando alguém sai da casa.

## 2. Objetivos
- **Dinamismo:** Permitir gerenciar moradores pela UI.
- **Persistência:** Salvar a lista de moradores no `localStorage`.
- **Integridade de Auditoria (Soft Delete):** Garantir que o nome de um ex-membro continue aparecendo em transações passadas, mas não esteja disponível para novos lançamentos.

## 3. Arquitetura Proposta

### 3.1 Core Domain: Entidade `Membro`
Local: `src/modules/ledger/core/domain/Membro.ts`

**Atributos:**
- `id`: string (UUID)
- `nome`: string
- `ativo`: boolean (Default: true)
- `dataCriacao`: Date

### 3.2 Persistência: `IMembroRepository`
Local: `src/modules/ledger/core/ports/IMembroRepository.ts` e `src/modules/ledger/adapters/LocalStorageMembroRepository.ts`

**Métodos:**
- `salvar(membro: Membro): Promise<void>`
- `listarTodos(): Promise<Membro[]>` (Retorna todos, inclusive inativos, para auditoria)
- `listarAtivos(): Promise<Membro[]>` (Retorna apenas membros para novos lançamentos)
- `buscarPorId(id: string): Promise<Membro | null>`

### 3.3 UI: Tela de Gerenciamento
Local: `src/components/ledger/SettingsMembros.vue` (ou similar)

**Funcionalidades:**
- Lista de membros atuais com botão de "Editar" e "Remover".
- Campo de entrada para adicionar novo membro.
- Toggle/Modal de confirmação para remoção (explicando que o histórico será mantido).

## 4. Plano de Transição
1. **Domínio:** Implementar a classe `Membro` e a interface do repositório.
2. **Adapter:** Implementar `LocalStorageMembroRepository` com suporte a serialização JSON.
3. **Migração:** Criar um script inicial para popular o `localStorage` com os membros atuais (Luan, Maria, João, Paula) caso o banco esteja vazio, evitando quebra de dados.
4. **UI:** Criar a interface de gestão e integrá-la ao `App.vue`.
5. **Integração Ledger:** Atualizar o `NovoLancamentoWizard` e o `DashboardSaldos` para consumirem a lista de membros do repositório em vez da lista fixa.

## 5. Critérios de Sucesso
- Possibilidade de adicionar um novo membro e vê-lo disponível no Wizard instantaneamente.
- Ao desativar um membro, ele deve desaparecer do Wizard, mas seu nome deve permanecer legível no Dashboard (histórico).
- Lista de membros persistida entre recarregamentos de página.
