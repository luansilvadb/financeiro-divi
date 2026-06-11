## ADDED Requirements

### Requirement: Orquestração de Etapas do Wizard
O sistema SHALL permitir que o usuário navegue por etapas distintas para completar um lançamento, mantendo o estado de forma coesa.

#### Scenario: Navegação entre passos
- **WHEN** o usuário clica em "Avançar" após preencher os dados válidos de uma etapa
- **THEN** o sistema SHALL transicionar para a próxima etapa com animação suave.

### Requirement: Seleção de Fluxo e Método
O sistema SHALL permitir a escolha inicial entre Despesa (PIX ou Cartão) e Empréstimo Pessoal.

#### Scenario: Seleção de Cartão de Crédito
- **WHEN** o usuário seleciona um cartão específico na primeira etapa
- **THEN** o sistema SHALL carregar o dono do cartão e as regras de fechamento da fatura correspondente.

### Requirement: Divisão de Gasto Dinâmica
O sistema SHALL permitir que o usuário selecione quais membros participam de uma divisão e calcule automaticamente as parcelas em centavos.

#### Scenario: Divisão igualitária
- **WHEN** o usuário seleciona "Todos" no passo de divisão
- **THEN** o sistema SHALL dividir o valor total entre todos os membros ativos, garantindo que a soma das partes seja exatamente igual ao total (distribuição de centavos restantes).
