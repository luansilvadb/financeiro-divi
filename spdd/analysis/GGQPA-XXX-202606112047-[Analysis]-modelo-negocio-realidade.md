# SPDD Analysis: Validação do Modelo de Negócios Divi (Family) com Evidências de Mercado

## Original Business Requirement
Antes de evoluir o desenvolvimento, precisamos iterar sobre o modelo de negócio com um olhar crítico: o problema que queremos resolver existe de verdade? Valide as premissas centrais comparando-as com dados reais, feedbacks de usuários ou evidências de mercado. Ajuste o modelo sempre que encontrar descolamento entre a solução proposta e a realidade do público-alvo. Não construímos para hipóteses — construímos para problemas confirmados.

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **Tenant (Moradia)**: Representa o isolamento de dados de um grupo residencial (moradia, casal, república). Reflete perfeitamente a realidade de grupos fechados que dividem contas e convivem sob o mesmo teto.
- **Usuario**: Credencial de acesso individual à plataforma.
- **MembroCasa**: Representação de um participante da moradia. Pode ser um membro virtual/órfão (`userId` opcional) ou linkado a um `Usuario`. Reflete a necessidade real de gerenciar despesas de pessoas que não usam o app (ex: crianças, pets, parentes dependentes ou moradores analógicos).
- **Cartao**: Cartão de crédito de um morador com responsável padrão e dia de fechamento. Permite centralizar o controle de cartões individuais cujos limites e faturas são usados para compras do grupo.
- **Fatura**: Fatura mensal do cartão de crédito de um morador, controlando o ciclo financeiro específico de fechamento.
- **Gasto**: Registro de transação financeira, que pode ser uma despesa comum, um empréstimo (`isLoan`) ou uma liquidação de saldo (`isSettlement`). Pode ser avulso (PIX, débito) ou associado a uma fatura de cartão.
- **DivisaoGasto**: Proporção do valor de um gasto distribuído para cada membro da casa. Permite divisões personalizadas em centavos.
- **ContaFixa**: Despesa recorrente da moradia (ex: aluguel, internet) com rateio padrão definido por JSON.

#### New Concepts Required
- **Calculadora de Proporcionalidade de Renda**: Mecanismo conceitual para sugerir e recalcular divisões dinamicamente com base nas rendas autodeclaradas dos membros da casa (atualmente o rateio é puramente manual ou estático). Estudos financeiros indicam que divisões proporcionais à renda são mais saudáveis a longo prazo para evitar atritos financeiros.
- **Gasto Privado com Impacto de Saldo (Private Expense)**: Flag ou conceito que permite que um gasto individual efetuado em um cartão compartilhado tenha sua descrição e detalhes ocultados para outros membros da casa, mantendo visível apenas o valor bruto que impacta a fatura e o saldo total. Isso equilibra a necessidade de privacidade com a necessidade de controle contábil.

#### Key Business Rules
- **Flexibilidade de Lançamento por Confiança (Trust-first)**: Em ambientes domésticos, as regras de permissão rígidas causam atrito de uso. Qualquer morador do Tenant pode lançar transações e cadastrar cartões em nome de outros, simplificando a operação baseada em confiança mútua.
- **Independência de Ciclos Financeiros (Competency-based Netting)**: Gastos avulsos (PIX, dinheiro) são computados imediatamente na data de competência do mês corrente, enquanto gastos em cartão entram apenas no mês de fechamento da respectiva fatura.
- **Transparência de Netting Simplificado**: O cálculo de quem deve a quem (Netting) deve ser consolidado e atualizado em tempo real, permitindo liquidações fáceis (`isSettlement`) sem necessidade de múltiplas transferências individuais.

---

## Strategic Approach

#### Solution Direction
1. **Adição de Suporte a Divisão Proporcional à Renda**:
   Evoluir o assistente de lançamento `NovoLancamentoWizard` e o cadastro de membros para permitir que o grupo configure as rendas de cada membro, sugerindo o rateio dinamicamente com base nisso (ex: se A ganha R$ 6.000 e B ganha R$ 4.000, sugerir divisão de 60/40), reduzindo a sobrecarga financeira subjetiva que gera atritos.
2. **Implementação de Mascaramento de Gastos Pessoais**:
   Introduzir uma flag `isPrivate` em `Gasto`. Se ativada, a descrição do gasto é exibida como "Gasto Pessoal" para outros membros da casa, mas o valor e o comprador continuam visíveis para o cálculo exato do saldo da fatura e do netting. Isso mitiga o problema da infidelidade financeira associado à falta de privacidade para pequenos mimos ou compras pessoais.

#### Key Design Decisions
- **Decisão**: Rateio Proporcional Dinâmico vs. Rateio Estático em Porcentagem.
  - *Trade-offs:* O rateio proporcional dinâmico exige cadastrar a renda de cada membro e manter esse histórico atualizado, o que adiciona campos de configuração. O rateio estático é mais simples, mas exige que os membros façam o cálculo de cabeça de quanto representa a divisão proporcional antes de configurar a porcentagem.
  - *Recomendação:* Implementar a funcionalidade opcional de sugestão baseada em renda declarada no wizard de lançamento, mantendo a estrutura flexível de `DivisaoGasto` inalterada no nível de banco de dados (o banco armazena apenas o valor final resultante da divisão).
- **Decisão**: Transparência Total vs. Gastos Privados no Dashboard.
  - *Trade-offs:* Transparência total é ideal para moradias do tipo república, mas em casais, a falta de privacidade para pequenos presentes ou gastos individuais causa atritos ou infidelidade financeira (esconder o gasto). O mascaramento de itens (apenas o valor conta para o balanço da fatura) resolve essa dor de privacidade sem quebrar o cálculo de saldos.
  - *Recomendação:* Introduzir a flag `isPrivate` no `Gasto`. Se true, a descrição é exibida como "Gasto Pessoal" para outros membros da casa, mas o valor e comprador continuam visíveis para o cálculo de saldos da fatura e netting.

#### Alternatives Considered
- **Contas Conjuntas Virtuais Integradas via API Bancária**: Rejeitado. Embora plataformas como a Cumbuca sigam esse caminho, isso adicionaria uma complexidade enorme de regulação de pagamentos (BACEN) e integrações de APIs bancárias específicas brasileiras. O Divi foca em ser um ledger de controle agnóstico de banco, viabilizando o uso imediato e flexível para qualquer tipo de conta.

---

## Risk & Gap Analysis

#### Requirement Ambiguities
- **Definição de Renda no Grupo**: Como lidar com flutuações de renda de membros freelancers na divisão proporcional? Se a divisão se basear em renda, o sistema deve tratar a renda como uma "sugestão histórica de divisão" e não como uma regra rígida e travada de banco.
- **Tratamento de Privacidade em Repúblicas**: A flag de privacidade de gastos faz sentido em casais, mas em repúblicas pode gerar desconfiança sobre gastos comuns maquiados. Deve ser uma feature configurável no nível de Tenant (Ex: "Permitir gastos privados: Sim/Não").

#### Edge Cases
- **Fechamento de Faturas com Gastos Privados**: O responsável pelo pagamento da fatura precisa saber o valor total a pagar ao banco. O sistema deve garantir que o valor total da fatura seja exato, mesmo que ele não possa ver o detalhe de alguns gastos privados dos outros moradores naquele cartão.
- **Inatividade de Membros com Saldos Pendentes**: Um morador que sai da casa mas tem saldos pendentes de netting. O sistema não deve permitir desativar ou remover membros se o saldo de netting não estiver zerado (`0.00`).

#### Technical Risks
- **Complexidade de Cálculo de Netting em Tempo Real**: Conforme mais gastos e divisões flexíveis são adicionados, o cálculo da matriz de transferências mínimas de compensação (Netting) pode se tornar lento no backend. Isso deve ser otimizado com algoritmos eficientes (ex: simplificação de grafos de dívidas) e cache.
- **Consistência de dados JSON em `default_split`**: A coluna `defaultSplit` no Prisma é um campo JSON livre. Alterações no formato desse JSON para suportar proporções baseadas em renda podem quebrar lançamentos antigos se não houver um validador/migrador robusto de esquemas JSON.

#### Acceptance Criteria Coverage
| AC# | Premissa / Dor de Mercado | Dados Reais de Mercado | Addressable? | Notas / Gaps |
|-----|---------------------------|------------------------|--------------|--------------|
| 1   | Dinheiro como principal fonte de atrito | **45% a 53%** dos casais brasileiros brigam por finanças. | Sim | Endereçado com suporte a divisão flexível e simplificação de netting. |
| 2   | Queda no uso de conta conjunta | Apenas **15%** dos casais mantêm conta conjunta. | Sim | Endereçado mantendo cartões e faturas individuais descentralizados no Tenant. |
| 3   | Divisão proporcional à renda | Especialistas recomendam divisão proporcional à renda. | Sim | Proposta de adicionar a Calculadora de Proporcionalidade no wizard. |
| 4   | Infidelidade financeira | **45% a 49%** já admitiram esconder gastos do parceiro. | Sim | Proposta de flag `isPrivate` para equilibrar transparência e privacidade. |
| 5   | Usuários analógicos / Dependentes | Crianças, pets ou parentes idosos não têm acesso. | Sim | Endereçado através da manutenção de membros virtuais sem necessidade de usuário vinculado. |
