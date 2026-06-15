# SPDD Analysis: Gasto Privado e Movimentação Pessoal com Externos

## Original Business Requirement
Eu quero melhorar uma funcionalidade que tem no sistema, que hoje já não faz mais sentido. No caso tem no caso é o gasto privado, onde ele oculta a descrição, né? dos moradores que não são autorizados, porém, essa forma não é uma forma a qual eu quero lidar. Eu pretendo colocar o sistema monitorando algumas movimentações pessoais, caso, né? O morador coloque a despesa apenas para ele, o sistema vai mostrar a movimentação só para ele. Outra coisa também, caso o morador coloque uma despesa entre ele devendo uma pessoa externa da casa, né, de um morador que não é cadastrado na casa, ele consiga ter o controle do que ele está devendo para pessoas externas. Isso é bastante usado para caso um morador ou um usuário queira controlar as suas despesas externas. Por exemplo, ele precisa Uma vendedora farmacêutica, por exemplo, ela vende um remédio mensalmente para um uma pessoa externa. E aí ela tem que anotar esse gasto ou no papel, mostrando que essa pessoa compra com ela todo mês, né? E no sistema, no app, ela pode já fazer esse controle. A minha intenção é, na navegação de itens do Bottom Bar, do dock, né? da rota de navegação, tenha uma rota a mais escrita pessoal, para que esse usuário, ele consiga ver o que que está aparecendo para ele. fazer o controle pessoal mesmo. Por exemplo, ah, ele quer fazer o controle, lançar uma despesa para uma pessoa externa da casa, que não precise cadastrar, entende? Como que a gente faria isso? Reaproveitando muito do que a gente tem aqui da casa. A intenção é não criar processos muito novos para o usuário não ficar confuso e ter que reaprender tudo de novo, mas reaproveitar algumas funcionalidades que já tem no sistema, aumentando. adicionando, na verdade, algumas features que necessita para que não precise fazer um módulo inteiro, tudo do zero, entende? Então, a ideia que eu tenho da jornada do usuário é que quando ele apertar na rota pessoal, né, do item de navegação da barra de tarefa, ele vá para a tela de movimentações pessoais e lá ele consiga ver as movimentações dele ou até gerenciar, né, vamos vamos ver se dá para reaproveitar o que é da casa e o que é pessoal para que ele consiga ter pelo menos o controle de pessoas que está fora da casa, para que para não precisar ter que cadastrar uma pessoa externa dentro da casa só para ter o controle. Até porque o a movimentação entre essa pessoa e a pessoa externa, né, morador interno da casa para a pessoa externa, é algo pessoal. Entendeu? Se ele ter que cadastrar essa pessoa externa dentro do da casa, bagunça o compartilhamento da casa em si. Então meio que fique bagunçado. Eu quero ter essa organização para que pessoas consiga fazer controle de movimentações externas sem que precise bagunçar o controle de compartilhamento da casa. E que essa movimentação externa seja privado, ou seja, só realmente apareça para a pessoa. Entre ela e o externo, não, as pessoas internas da casa não veem essa movimentação. Tanto descrição, tanto movimentação, valor, isso não influencia na casa, porque é algo de uma pessoa que não está cadastrada no sistema.

## Domain Concept Identification

### Existing Concepts (from codebase)
- **Gasto**: Representação de despesas e transações. Possui o campo `isPrivate` (atualmente apenas altera a descrição para "Gasto Pessoal" para outros usuários na listagem) e `isLoan` (indica se é um empréstimo).
- **DivisaoGasto**: Divisão proporcional ou igual do valor de um gasto entre participantes. Aponta para IDs de devedores/participantes.
- **MembroCasa**: Moradores associados à casa compartilhada (Tenant).
- **Tenant (Casa)**: A entidade de escopo que agrupa moradores e finanças.

### New Concepts Required
- **PessoaExterna (Fictício/Emulado)**: Pessoa que não faz parte da casa. Não possui cadastro físico na tabela `membros_casa`, mas é representada por um ID fictício padronizado `externo:<Nome>` em transações de gastos privados para que o sistema consiga mapear créditos e débitos e resolver nomes dinamicamente sem poluir a moradia.
- **MovimentacaoPessoal**: Gasto de escopo puramente individual ou entre o usuário e uma ou mais pessoas externas. Possui `isPrivate = true` e deve ser 100% invisível para os demais membros da casa. Não interfere nos saldos da moradia compartilhada nem nos relatórios de fechamento gerais.

### Key Business Rules
- **Isolamento Estrito de Privacidade**: Gastos privados só podem ser retornados na API para o usuário logado que os gerou (comprador ou dono do cartão). Nenhuma informação de descrição, valor ou existência do gasto pode ser vazada para outros membros da casa.
- **Não-interferência Financeira**: Gastos privados (tanto despesas individuais quanto transações com pessoas externas) devem ser ignorados no cálculo dos saldos compartilhados da casa (netting, saldos unificados, extrato da casa).
- **Consolidação de Dívidas Externas**: O saldo acumulado e a transação individual com externos devem ser consolidados apenas no extrato pessoal do usuário através da varredura de seus gastos privados em que há participantes ou devedores do tipo `externo:<Nome>`.
- **Simplificação de Fluxo Privado**: No lançamento de um gasto privado, o comprador padrão é sempre o usuário atual. Se for uma despesa pessoal (100% dele), divide apenas consigo mesmo. Se for com externo, divide com IDs de tipo `externo:Nome` ou define um deles como devedor (`borrowerId`) em caso de empréstimo.

## Strategic Approach

### Solution Direction
- **Backend**:
  - Ajustar o endpoint `GET /financeiro/gastos` no [FinanceiroController](file:///d:/projetos/financeiro-divi/backend/src/financeiro/financeiro.controller.ts) para filtrar gastos privados, retornando-os apenas se o usuário logado for o comprador ou proprietário do cartão.
- **Frontend (Lógica de Negócios e Saldos da Casa)**:
  - Modificar a função `calcularSaldosUnificados` em [NettingService.ts](file:///d:/projetos/financeiro-divi/src/models/services/NettingService.ts) para pular transações privadas (`g.isPrivate === true`).
  - Atualizar o extrato da casa em [ExtratoService.ts](file:///d:/projetos/financeiro-divi/src/models/services/ExtratoService.ts) para também ignorar gastos privados na visualização comum de moradia.
- **Frontend (Controle de Finanças Pessoais)**:
  - Criar um módulo de serviços/helpers de finanças pessoais (ex: `src/models/services/ExtratoPessoalService.ts` ou similar) que analisa todos os gastos recebidos e calcula:
    - O total gasto individualmente pelo usuário no mês.
    - O saldo corrente devedor ou credor do usuário com cada pessoa externa (`externo:Nome`).
    - Uma lista de transações pessoais e de externos.
- **Frontend (Interface e Navegação)**:
  - Adicionar a aba `pessoal` no [BottomTabBar.vue](file:///d:/projetos/financeiro-divi/src/views/components/ui/BottomTabBar.vue) com ícone apropriado (como `Wallet` ou `User`).
  - No [App.vue](file:///d:/projetos/financeiro-divi/src/App.vue), gerenciar a aba `pessoal` renderizando um novo painel pessoal no [DashboardSaldos.vue](file:///d:/projetos/financeiro-divi/src/views/screens/DashboardSaldos.vue).
  - No painel pessoal (`isPessoal`), exibir:
    - Um card de resumo financeiro pessoal (gastos pessoais totais, total a pagar a externos, total a receber de externos).
    - Uma seção interativa contendo a lista de pessoas externas com seus respectivos saldos e um botão "Liquidar" que cria um acerto (settlement) privado rápido para zerar a pendência.
    - O feed de atividades/gastos exclusivos pessoais e de externos.
  - No Wizard de lançamento ([NovoLancamentoWizard.vue](file:///d:/projetos/financeiro-divi/src/views/screens/NovoLancamentoWizard.vue)):
    - Permitir alternar o toggle "Gasto Privado" na etapa de descrição ou ajustar o padrão caso aberto a partir da aba Pessoal.
    - Se o gasto for privado, na etapa de divisão ou tomador de empréstimo, permitir a digitação de uma pessoa externa através de um botão "+ Pessoa Externa". Isso adiciona temporariamente a pessoa externa na lista local para seleção e cria o ID de formato `externo:Nome`.

### Key Design Decisions
- **Uso do Prefixo `externo:` no ID de Membro**:
  - *Decisão*: Representar membros externos no banco de dados e no frontend apenas pelo ID string com formato `externo:<Nome>`.
  - *Trade-offs*:
    - Prós: Evita a criação de tabelas novas de contatos/externos no banco de dados e dispensa o cadastro formal deles como membros da moradia. Mapeia o nome dinamicamente decodificando a string do ID (ex: `id.substring(8)`). Altamente robusto e compatível com as validações atuais.
    - Contras: Se o usuário digitar "Maria Farmacia" e depois "Maria Farmácia", o sistema identificará como dois externos distintos.
    - *Recomendação*: Propor na interface um autocompletar simples baseado nos nomes de externos já utilizados nos gastos anteriores para evitar divergências de digitação.

### Alternatives Considered
- **Criar tabelas de `MembroExterno` no banco**:
  - *Motivo de Rejeição*: Adicionaria alta complexidade ao banco de dados e quebras de integridade nos mapeamentos de relacionamentos existentes sem trazer um ganho prático que compense o esforço, ferindo a premissa de reaproveitar ao máximo a arquitetura existente.

## Risk & Gap Analysis

### Requirement Ambiguities
- **Exclusão de Dívidas / Liquidação com Externos**:
  - *Ambiguidade*: Como o usuário limpa ou zera a pendência quando ele acerta a conta pessoalmente com a pessoa de fora?
  - *Resolução*: O sistema exibirá uma lista de saldos individuais por pessoa externa na tela Pessoal. Haverá um botão "Liquidar" que lançará automaticamente um acerto privado (`isPrivate: true`, `isSettlement: true`) entre o usuário e o externo correspondente.

### Edge Cases
- **Uso de Cartão de Crédito Compartilhado em Gasto Privado**:
  - *Cenário*: O usuário lança um gasto privado usando o cartão de outro morador.
  - *Impacto*: O dono do cartão precisa conciliar a fatura.
  - *Mitigação*: Restringir lançamentos privados com cartões a apenas cartões cujo dono seja o próprio usuário logado, ou se utilizar o cartão de outro membro, o sistema avisará que o dono do cartão verá apenas a informação resumida "Gasto Pessoal de R$ X" (como já ocorre hoje na conciliação, mantendo a descrição e o externo ocultos).

### Technical Risks
- **Desempenho no Filtro de Gastos Privados no Frontend**:
  - *Risco*: Filtrar gastos em memória no frontend para extratos e saldos pode ter impacto de performance se a lista for massiva.
  - *Mitigação*: O volume de gastos por período de fatura é reduzido e gerenciável (normalmente dezenas ou centenas de registros). O filtro em tempo de computação das computed properties do Vue 3 é extremamente eficiente para essa escala.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1   | Gastos privados de um usuário devem ser 100% invisíveis para os outros membros (tanto valor quanto descrição). | Sim | Implementado via filtragem estrita no endpoint do backend. |
| 2   | Gastos privados e movimentações com externos não devem alterar saldos, faturas ou netting da moradia compartilhada. | Sim | Implementado filtrando gastos privados nos helpers do frontend de netting e saldos unificados. |
| 3   | Criação de uma aba "Pessoal" na Bottom Bar para visualização de movimentações individuais e de externos. | Sim | Nova rota na BottomTabBar e renderização correspondente no DashboardSaldos. |
| 4   | Possibilidade de lançar empréstimo ou dividir despesa com pessoas externas sem necessidade de cadastro no sistema. | Sim | Implementado com IDs fictícios do tipo `externo:Nome` inseridos inline no Wizard de lançamento. |
| 5   | Exibição de saldos pendentes consolidados por pessoa externa e opção de liquidar o saldo com um clique. | Sim | Painel de controle de externos com botão para registrar o acerto privado rápido. |
