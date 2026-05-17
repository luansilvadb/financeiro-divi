# Especificação de Design: DIVI Versão Sênior v18

Esta especificação define as fases 2, 3, 4 e 5 do projeto **DIVI Versão Sênior v18**, estendendo a lógica do protótipo em `fluxo-senior-v18.html` para a arquitetura modular e reativa em Vue 3 + TypeScript, preparando a aplicação para uma futura sincronização relacional via Supabase.

---

## 1. Habilitando a Sincronização Supabase: Extensões do Domínio

Para permitir que o checklist dinâmico e os acertos customizados se conectem diretamente a um banco de dados relacional sem redundâncias ou riscos de dessincronização, as entidades de domínio existentes receberão novos atributos opcionais.

### 1.1. Modificações em `GastoProps` (`src/modules/ledger/core/domain/Gasto.ts`)

```typescript
export interface GastoProps {
  id: string
  faturaId: string
  descricao: string
  valorTotal: number
  compradorId: string
  divisoes: Array<{
    membroId: string
    valor: number
  }>
  installments: number
  isLoan?: boolean
  borrowerId?: string | null

  // --- EXTENSÕES SENIOR V18 ---
  recurringBillId?: string | null    // FK para o template de Conta Fixa (Fase 2)
  isSettlement?: boolean             // Indica se o gasto é um acerto/carryover (Fase 4)
  settlementDetails?: {              // Metadados específicos do acerto customizado
    fromMemberId: string
    toMemberId: string
    method: 'pix' | 'cash' | 'mutual' // PIX, Dinheiro físico, ou Abatimento mútuo
  } | null
}
```

### 1.2. Entidade de Template de Contas Fixas (`ContaFixa`)

As Contas Fixas são cadastradas como modelos. Elas definem o template para a geração automática do gasto e da divisão no mês atual.

```typescript
export interface ContaFixa {
  id: string
  name: string
  icon: string
  fixedValue: number | null // null se o valor for variável a cada mês (ex: luz, água)
  defaultSplit: string[]   // Array de IDs dos membros (ex: ['luciana', 'luan', 'joao'])
}
```

---

## 2. Fase 2: Checklist de Contas Fixas (Talões Recorrentes)

### 2.1. Cálculo Dinâmico de Status
Para evitar tabelas de estado adicionais no banco de dados e bugs de inconsistência de exclusão:
* O status **"Pago"** ou **"Aguardando Talão"** de uma `ContaFixa` no período corrente é computado de forma reativa.
* **Fórmula de Status:**
  ```typescript
  const isPaid = computed(() => {
    return gastosDaFaturaAberta.some(g => g.recurringBillId === contaFixa.id);
  });
  ```
* Se o usuário excluir o `Gasto` associado, a relação desaparece instantaneamente e a conta retorna ao estado "Aguardando Talão" no checklist de forma natural e limpa.

### 2.2. Popover de Lançamento em Tela Única
Quando o usuário clica em **"Lançar"** sobre uma conta fixa pendente:
1. Abre-se um popover contextual posicionado diretamente sobre o card.
2. **Seletor de Valor:** Focado automaticamente. Pré-preenche com `fixedValue` se configurado, permitindo alteração rápida.
3. **Quem pagou:** Grid simples de avatares com seleção única rápida.
4. **Quem participa:** Grid de avatares com checkboxes para selecionar os moradores que dividem. Pré-marca os moradores informados em `defaultSplit`.
5. **Painel Reassegurador Cognitivo:** Exibe um resumo dinâmico formatado por extenso das divisões reais para total conforto do usuário.
6. **Lançamento Financeiro:** Ao confirmar, chama `Dinheiro.distribuir()` para evitar erros de dízima/centavos e cria o `Gasto` preenchendo a propriedade `recurringBillId`.

### 2.3. CRUD de Templates de Contas Fixas
* Um botão ⚙️ ao lado do nome do talão abre o editor de templates para ajustar nome, emoji, valor sugerido e divisão padrão.
* Um card tracejado no fim do grid permite inserir novos modelos de contas fixas de forma contínua.

---

## 3. Fase 3: Virada de Mês e Transporte de Saldos

### 3.1. Trancamento de Mês (`isMonthLocked`)
* A variável de estado reativa `isMonthLocked` congela toda a fatura e gastos do período ativo.
* Com o mês trancado, todas as ações de edição, exclusão e novos lançamentos no assistente são desabilitadas na UI.

### 3.2. Modal e Lógica de Transição de Período
Ao trancar o mês, o botão **"🚀 Iniciar Novo Período"** fica visível. Ao ser acionado:
1. **Histórico:** Copia o estado do período fechado para o repositório de histórico `divi_history` no `LocalStorage`.
2. **Transporte de Compras Parceladas:**
   * Varre os gastos do mês encerrado procurando parcelamentos ativos (`installments > 1`).
   * Para cada registro, gera um novo `Gasto` na nova fatura copiando os dados e decrementando as parcelas restantes (`installments - 1`).
3. **Transporte de Saldos Finais (Netting):**
   * Executa o algoritmo de compensação ótima sobre os saldos finais da fatura fechada.
   * Para cada compensação sugerida (Morador $X$ deve R$ $V$ para Morador $Y$), gera uma transação de abertura no novo período:
     * **Descrição:** `Saldo Inicial Pendente ([Período Anterior])`
     * **Valor:** $V$
     * **Payer (Quem Pagou):** $Y$ (o credor)
     * **Split (Divisão):** $X$ (o devedor assume 100% da cobrança, sendo o único cobrado)
     * **isSettlement:** `true`
4. **Reset do Checklist:** No novo período, não existem gastos relacionados às contas fixas, fazendo com que todas retornem a "Aguardando Talão" automaticamente.

---

## 4. Fase 4: Acerto Customizado

### 4.1. Popover/Modal de Ajuste de Compensação
Ao visualizar as sugestões de transferências na área "Intel Saldos" (Encontro de Contas), o botão **"Já fiz / recebemos este PIX"** abre o modal de baixa customizada:
* Permite ajustar o valor real pago (caso decidam fazer um acerto parcial).
* Permite selecionar a via de transação:
  * `pix` (PIX Imediato)
  * `cash` (Dinheiro físico)
  * `mutual` (Abatimento de valores passados)
* Grava um gasto especial com `isSettlement: true` e `settlementDetails` preenchidos.
* Reduz instantaneamente o saldo pendente em tempo real no dashboard.

---

## 5. Fase 5: Accordions e Polimento UI

* **Visual das Faturas (Extratos):**
  * Substituição de listas chapadas por accordions elegantes. Cada fatura de cartão (Luan, João) e Pix será encapsulada em um accordion colapsável reativo que, ao expandir, revela o extrato detalhado com layout de alta fidelidade e micro-animações.
* **Projeção de Parcelas Futuras:**
  * Painel dedicado listando claramente os meses subsequentes e a soma total das parcelas de cartões que virão nos períodos seguintes, garantindo total previsibilidade financeira para a casa.
* **Badges de Atividade:**
  * No feed recente de despesas, badges minimalistas e vibrantes identificam o tipo da conta (`🤝 Empréstimo Direct`, `🔄 Saldo Inicial`, `💳 Nubank`, etc.) com clareza imediata.
