## Context

O método de baixa "Ajuste" (ou `mutual`) é uma opção que confunde os moradores ao realizar o acerto de contas (netting). Para simplificar o sistema, removeremos a opção visual da interface do usuário e limparemos as definições de tipos associadas no frontend.

## Goals / Non-Goals

**Goals:**
* Remover a opção de "Ajuste" (método `mutual`) da tela de acerto de compensação (`BottomSheetAcertoCompensacao.vue`), ajustando o layout para 2 colunas ("Pix" e "Dinheiro").
* Expurgar o tipo `'mutual'` dos fluxos ativos de criação de novos gastos de acerto (em `GastoService.ts` e classes associadas).
* Atualizar testes unitários e de integração que esperavam ou utilizavam `'mutual'` ou "Ajuste".

**Non-Goals:**
* Não faremos migrações destrutivas no banco de dados. Caso existam registros históricos no banco contendo `method: "mutual"`, o frontend continuará lidando de forma segura sem crashar, mas o usuário não poderá mais criar novas transações com este método.

## Decisions

### 1. Ajuste da Interface do Usuário (UI)
Remover o item `{id:'mutual', n:'Ajuste', icon: RefreshCcw}` do array de renderização em `BottomSheetAcertoCompensacao.vue` e alterar a classe do contêiner de `grid-cols-3` para `grid-cols-2`.

### 2. Refatoração dos Tipos de Domínio no Frontend
* Em `d:/projetos/financeiro-divi/src/views/components/ledger/dashboard/BottomSheetAcertoCompensacao.vue`, a variável `method` passará a ser tipada como `'pix' | 'cash'`.
* Em `d:/projetos/financeiro-divi/src/models/entities/Gasto.ts` e `d:/projetos/financeiro-divi/src/models/services/GastoService.ts`, limitar a tipagem dos novos acertos a `'pix' | 'cash'`. No entanto, para garantir que dados históricos salvos com `'mutual'` não causem erros de tipagem ao serem lidos do banco de dados, a propriedade `settlementDetails.method` continuará aceitando `'mutual'` em modo de leitura (readonly histórico).

### 3. Ajuste de Testes
* Localizar e atualizar arquivos como `useDashboardViewModel.test.ts` e similares que usem o tipo `mutual` ou "Ajuste".

## Risks / Trade-offs

* **[Risco]** Erro de tipagem ao carregar dados antigos com o método de liquidação `'mutual'`.
  * **Mitigação**: Na entidade de domínio `Gasto`, a tipagem de leitura `settlementDetails.method` continuará aceitando `'mutual'` como união de tipos (`'pix' | 'cash' | 'mutual'`) apenas para desserialização segura, mas todas as interfaces de inserção e a UI restringirão a criação ao conjunto de tipos `'pix' | 'cash'`.
