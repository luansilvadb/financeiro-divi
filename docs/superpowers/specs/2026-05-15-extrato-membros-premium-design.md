# Spec: Extrato Premium de Membros (Mobile-First)

Refatoração da interface de detalhamento (drilldown) de cada morador para um formato de "Ledger Narrativo" em vez de tabela, otimizado para mobile (412px) e focado em clareza de fluxo financeiro.

## Escopo

- **Componente:** `DashboardSaldos.vue`.
- **Alvo:** A lista de transações exibida ao expandir um membro.
- **Responsividade:** O layout deve ser fluido, mas otimizado para larguras mobile, eliminando o scroll horizontal.

## Design de UX

### O Card de Transação

Cada transação será representada por um card com a seguinte hierarquia:

1.  **Cabeçalho:**
    - Lado Esquerdo: Descrição da transação e Data (formato DD MMM).
    - Lado Direito: **Impacto no Saldo** (Verde para +, Vermelho para -, Cinza para 0). Este é o valor líquido que altera o saldo do membro.
2.  **Barra de Proporção:** Uma linha sutil (4px) abaixo do título mostrando a relação entre a parte do membro (azul/vermelho) e a parte dos outros (cinza claro).
3.  **Seção de Fluxo (Grid 2 colunas):**
    - **Você desembolsou:** O valor real pago pelo membro nesta transação.
    - **Sua parte:** O valor que o membro consumiu/deve desta transação.
4.  **Rodapé de Contexto:** Notas explicativas (ex: "Gasto individual pago integralmente por você") quando necessário.

## Design Técnico

### Componente `DashboardSaldos.vue`

- Substituir a tag `<table>` por uma `<div>` com `flex flex-col gap-4`.
- Utilizar a função `formatDate` para exibir datas como "14 Mai".
- **Cores Dinâmicas:**
    - Positivo: `text-emerald-600` / `bg-emerald-500`.
    - Negativo: `text-red-500` / `bg-red-500`.
    - Neutro: `text-slate-400` / `bg-slate-200`.

## Verificação

1.  **Mobile (412px):** Abrir o detalhamento e verificar se não há scroll horizontal.
2.  **Linguagem:** Validar que o termo "Sua parte" é utilizado em vez de "Cota".
3.  **Alinhamento:** Validar que os valores monetários usam fonte mono-espaçada (`font-mono`) para facilitar a leitura.
4.  **Saldo Acumulado:** O saldo acumulado deve ser exibido como um "Novo Saldo" ou "Saldo Atual" após cada transação ou no final da lista.
