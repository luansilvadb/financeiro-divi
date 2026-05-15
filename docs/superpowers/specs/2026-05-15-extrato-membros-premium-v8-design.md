# Spec: Extrato Premium de Membros (Alta Fidelidade V8)

Refatoração completa da interface de detalhamento (drilldown) de cada morador para um formato de "Extrato de Fluxo Financeiro" com design simétrico, hierarquia visual clara e revelação progressiva (Progressive Disclosure).

## Escopo

- **Componente:** `DashboardSaldos.vue`.
- **Funcionalidade:** Exibição de cards de transação expansíveis com auditoria detalhada.
- **Plataforma:** Otimizado para mobile (412px), sem scroll horizontal.

## Princípios de Design Aplicados

1.  **Grid de 8pt:** Espaçamento consistente (paddings de 16px/24px, gaps de 8px/16px).
2.  **Hierarquia de 3 Níveis:**
    - **Nível 1 (Âncora):** Nome da despesa e Valor de Impacto Principal (ex: +100,00).
    - **Nível 2 (Fluxo):** Grid simétrica com "Você Pagou" vs "Sua Parte".
    - **Nível 3 (Status):** Saldo acumulado posicionado como âncora final com fundo tintado (8% opacidade).
3.  **Progressive Disclosure:** Detalhes técnicos (Total da Nota e Auditoria por Pessoa) ocultos por padrão.
4.  **Simetria Óptica:** Alinhamento vertical pelo centro e espelhamento de colunas.

## Elementos de UI

### O Card (Estados: Crédito, Débito, Neutro)
- **Borda Lateral:** Indicador de cor semântica (Emerald-500, Red-500, Slate-300).
- **Badge de Status:** Chip compacto indicando o tipo de lançamento.
- **Tipografia:** 
    - Textos: Inter (700 para títulos, 600 para labels).
    - Valores: JetBrains Mono / Mono-espaçado (800 para impacto).
- **Avatares:** Iniciais dos participantes em círculos de 28px com borda branca e sobreposição (-8px).

### Área Expandida (Gaveta de Auditoria)
- **Fundo:** `bg-slate-50/80` com bordas internas.
- **Conteúdo:** 
    - Total Bruto da Nota.
    - Lista de participantes com subtítulo explicativo (ex: "Pagou R$ X na boca do caixa" ou "Não contribuiu").

## Design Técnico

- **Variável de Estado:** `expandedTransactionId` (ref<string | null>) para controlar qual card está aberto.
- **Cores Tailwind:**
    - Crédito: `text-emerald-600`, `bg-emerald-50`.
    - Débito: `text-red-600`, `bg-red-50`.
    - Neutro: `text-slate-400`, `bg-slate-100`.
- **Transição:** Animação suave de abertura da gaveta.

## Verificação

1.  **Simetria:** Validar que as colunas de "Você Pagou" e "Sua Parte" têm o mesmo peso visual.
2.  **Linguagem:** Uso estrito de "Sua parte" em vez de "Cota".
3.  **Auditoria:** Confirmar que ao expandir, a soma das partes dos membros bate com o "Total da Nota".
4.  **Responsividade:** Garantir que em 412px de largura o card mantém margens confortáveis.
