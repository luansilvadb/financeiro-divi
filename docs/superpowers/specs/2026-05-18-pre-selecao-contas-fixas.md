# Spec: Pré-seleção Automática em Contas Fixas

**Data:** 2026-05-18
**Status:** Approved
**Topic:** UX Improvement

## 1. Problema
Ao lançar uma conta fixa (ex: Aluguel), o sistema utiliza uma lista pré-definida de "quem divide" (defaultSplit) salva no template da conta. No entanto, se os IDs dos moradores no navegador não coincidirem com os IDs no template (o que ocorre frequentemente com dados iniciais), o sistema acaba pré-selecionando apenas uma pessoa ou ninguém, obrigando o usuário a marcar manualmente todos os moradores a cada lançamento.

## 2. Solução Proposta
Implementar uma lógica de "Fallback para Todos" no componente de lançamento de contas fixas. O sistema tentará usar a configuração do template, mas se não encontrar correspondências válidas entre os moradores atuais, ele selecionará automaticamente todos os moradores ativos da casa.

### 2.1 Benefícios
- **Agilidade:** Reduz o número de cliques para o cenário mais comum (dividir com todos).
- **Resiliência:** Lida elegantemente com divergências de IDs entre templates padrão e moradores reais.
- **Flexibilidade:** O usuário ainda pode desmarcar pessoas manualmente após a pré-seleção automática.

## 3. Detalhes Técnicos

### 3.1 Alterações no Componente
Arquivo: `src/components/ledger/PopupLancarContaFixa.vue`

- Modificar o `watch` que observa a prop `bill`.
- Filtrar os `defaultSplit` do template contra a lista de `membros` atuais.
- Se a lista filtrada estiver vazia, preencher `splitIds` com os IDs de todos os membros disponíveis.

```typescript
// Lógica de inicialização dos splitIds
const validSplitIds = newBill.defaultSplit.filter(id => 
  props.membros.some(m => m.id === id)
)

if (validSplitIds.length > 0) {
  splitIds.value = [...validSplitIds]
} else {
  // Fallback: Seleciona todos os moradores da casa
  splitIds.value = props.membros.map(m => m.id)
}
```

### 3.2 Atualização de Templates (Opcional/Futuro)
Embora o foco seja o fallback dinâmico, os templates salvos em `useContasFixas.ts` também poderiam ser limpos, mas a solução no componente é mais robusta por ser dinâmica.

## 4. Testes e Verificação
1. **Cenário IDs Compatíveis:** Abrir uma conta fixa cujo template contenha IDs que existam na casa. Apenas esses devem ser marcados.
2. **Cenário IDs Incompatíveis:** Abrir uma conta fixa com IDs inexistentes (ex: template limpo). **Todos** os moradores da casa devem aparecer marcados.
3. **Cenário Novos Moradores:** Adicionar um novo morador e abrir o lançamento. Ele deve ser incluído na pré-seleção automática se o template não tiver uma lista válida.
