# SPDD Analysis: Padronização e Formatação de Valores Monetários em BRL

## Original Business Requirement
no passo 3 do Wizard pergunta "Qual foi o valor total ?" o usuario pode colocar literalmente 3213123123133213, primeiro que o numero não fica formatado no formato de moeda brasileiro segundo que o resto do app também não fica formatado na moeda brasileira causando brechas para má interpretação

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **Dinheiro**: Entidade no frontend (`src/models/entities/Dinheiro.ts`) que encapsula valores monetários em centavos (usando inteiros) para evitar problemas de arredondamento de floats.
- **Gasto**: Modelo que persiste os lançamentos e contém valores expressos em centavos de reais (`valorTotalCentavos` e `valorCentavos` como `BigInt` no banco).
- **Renda Mensal**: Propriedade de renda dos membros, já formatada usando máscara BRL no cadastro de novos moradores em `MembroFormBottomSheet.vue`.

#### New Concepts Required
- **Formatação Centralizada BRL (Moeda)**: Uma função ou serviço utilitário centralizado (`formatarBRL`) que formata números (reais ou centavos) de acordo com o padrão local (`toLocaleString('pt-BR')`), incluindo separadores de milhares e decimais.
- **Máscara de Entrada de Lançamento (Wizard Currency Mask)**: Mecanismo de máscara no input de valor do Wizard (`StepValueInput.vue`) para formatar em tempo real conforme o usuário digita (ex: digitando `1234` vira `R$ 12,34`), similar ao que já é feito para a renda, mas adaptado para o fluxo do lançamento.
- **Validação de Limite Monetário**: Regra que estabelece um teto razoável para lançamentos (ex: R$ 99.999.999,99) para evitar overflow numérico em JavaScript (`Number.MAX_SAFE_INTEGER`) e no banco.

#### Key Business Rules
- **Formatação Visual Uniforme**: Todo valor monetário exibido na interface deve obrigatoriamente usar o padrão brasileiro `pt-BR` (ex: `R$ 1.250,00` e não `R$ 1250,00` ou `R$ 1250.00`).
- **Máscara de Digitação no Wizard**: A entrada de valor no Wizard deve refletir imediatamente a formatação brasileira de moeda à medida que é digitada, impossibilitando inserções inválidas ou sem contexto decimal.
- **Validação de Valor Máximo**: Valores acima de um limite razoável para finanças domésticas (ex: R$ 99.999.999,99) devem ser rejeitados no input do Wizard para proteger a consistência dos cálculos do sistema.

## Strategic Approach

#### Solution Direction
1. **Centralização da Formatação**: Criar um utilitário central `src/shared/utils/formatarMoeda.ts` exportando funções como `formatarBRL` e `formatarCentavosParaBRL` baseadas em `Intl.NumberFormat('pt-BR')`.
2. **Substituição Sistêmica**: Mapear e substituir os inlining de formatação de valores (`toFixed(2).replace('.', ',')`) pelo novo utilitário em toda a interface do frontend (telas de extrato, cartões, atividades, etc.).
3. **Máscara reativa em StepValueInput**: Alterar o input numérico simples em `StepValueInput.vue` para um campo de texto formatado reativamente, similar ao de `MembroFormBottomSheet.vue`, emitindo de volta o valor numérico em reais correspondente e implementando um limite superior seguro de digitação.

#### Key Design Decisions
- **Uso do utilitário `Intl.NumberFormat`**: Em vez de manipulações de strings de baixo nível (como `.toFixed(2).replace('.', ',')`), utilizar a API padrão do navegador `Intl.NumberFormat` que lida nativamente com localização, símbolos e agrupamento de milhares.
- **Abordagem de Máscara de Entrada Customizada**: Optar por extrair e aprimorar a lógica de máscara manual baseada em eventos `@input` (já presente em `MembroFormBottomSheet.vue`) como uma função reutilizável, ao invés de adicionar dependências externas pesadas (como `v-money`), mantendo o bundle leve e sem acoplamentos.
- **Enforcement de Limites**: Implementar a validação e bloqueio de caracteres não numéricos diretamente na digitação, limitando a quantidade de caracteres para evitar estouro de representação numérica no JavaScript.

#### Alternatives Considered
- **Uso de biblioteca externa (ex: vue-currency-input)**: Rejeitado para evitar dependência externa complexa em um formulário simples. A solução nativa e modular com helpers em TypeScript/Vue 3 é leve e atende perfeitamente ao requisito.

## Risk & Gap Analysis

#### Requirement Ambiguities
- **Limite Máximo Exato**: O requisito não especifica qual o valor máximo permitido para um gasto. Definiremos o limite superior de R$ 99.999.999,99 como premissa de segurança técnica.

#### Edge Cases
- **Exclusão total do valor (Backspacing)**: O campo deve reiniciar graciosamente para `R$ 0,00` se o usuário apagar tudo.
- **Zeros à esquerda**: Digitar múltiplos zeros seguidos não deve corromper a formatação (ex: `000005` deve virar `R$ 0,05` e não `R$ 00,05`).
- **Valores centavos na divisão (Dízimas)**: Divisão de grandes valores com muitas parcelas entre moradores pode gerar dízimas periódicas de centavos, o que é mitigado pela distribuição da classe `Dinheiro` (usando `valorNoIndice`), mas visualmente deve ser demonstrado de forma arredondada e consistente.

#### Technical Risks
- **Precisão Numérica do JavaScript**: Entrada de valores extremamente grandes (ex: `3213123123133213` reais) geram centavos que extrapolam o limite de inteiros seguros em JS (`9007199254740991` centavos), resultando em perda de precisão e bugs de arredondamento. O limite de segurança visual protege o sistema de estouro de inteiros.

#### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1   | Lógica de máscara no passo 3 do Wizard (Valor Total) exibindo formatação brasileira (R$ X.XXX,XX) na digitação. | Yes | Será implementado no `StepValueInput.vue`. |
| 2   | Limitação e validação de valores astronômicos (evitando R$ 3213123123133213,00) no Wizard. | Yes | Será imposto limite técnico de R$ 99.999.999,99 na validação e na máscara. |
| 3   | Formatação unificada em todo o restante do app (Dashboard, Extrato, Atividades, Contas Fixas). | Yes | Substituição dos `.toFixed` espalhados pelo utilitário unificado de formatação. |
