# SPDD Analysis: Validação Crítica e Ajuste do Modelo de Negócios DIVI

## Original Business Requirement
Antes de evoluir o desenvolvimento, precisamos iterar sobre o modelo de negócio com um olhar crítico: **o problema que queremos resolver existe de verdade?** Valide as premissas centrais comparando-as com dados reais, feedbacks de usuários ou evidências de mercado. Ajuste o modelo sempre que encontrar descolamento entre a solução proposta e a realidade do público-alvo. Não construímos para hipóteses — construímos para problemas confirmados.

---

## Domain Concept Identification

### Domain Concept Identification

#### Existing Concepts (from codebase)
- **Tenant (Moradia)**: Representa o isolamento contábil e de dados de um núcleo familiar ou grupo de moradores (casais, repúblicas, etc.). Centraliza faturas, gastos e configurações comuns.
- **MembroCasa**: Representa um participante da moradia. Pode possuir renda (`rendaCentavos`), e pode ser um usuário real com login ou apenas um perfil virtual para controle de despesas (crianças, pets, parentes analógicos).
- **Cartao**: Cartão de crédito associado a um `MembroCasa` (dono) dentro do `Tenant`.
- **Fatura**: Agrupamento mensal dos gastos realizados em um determinado cartão de crédito.
- **Gasto**: Registro de transação financeira comum, empréstimo (`isLoan`) ou acerto de netting (`isSettlement`). Contém a flag `isPrivate` e o `cardOwnerId`.
- **DivisaoGasto**: Associação detalhando a fatia monetária (`valorCentavos`) que cabe a cada `MembroCasa` para um gasto específico.
- **ContaFixa**: Modelo de despesa recorrente contendo um rateio padrão (`defaultSplit`) salvo como JSON.

#### New Concepts Required
- **Histórico Contábil Congelado (Historical Ratio Freeze)**: Mecanismo de persistência das proporções calculadas no momento do lançamento, impedindo que flutuações e alterações posteriores nos perfis de renda modifiquem cálculos retroativos.
- **Pista de Auditoria do Ledger (Ledger Audit Log)**: Registro histórico imutável de quem inseriu, editou ou removeu despesas ou modificou dados de renda, garantindo transparência no modelo descentralizado de confiança.

#### Key Business Rules
- **Mascaramento Condicional de Privacidade**: A descrição do gasto privado (`isPrivate = true`) só é exibida para o comprador (`compradorId`) e para o dono do cartão (`cardOwnerId`). Os demais visualizam apenas `"Gasto Pessoal"`, mantendo a transparência de valores sem expor dados constrangedores.
- **Imutabilidade de Lançamentos Fechados**: Gastos associados a faturas com status `"PAGA"` ou `"FECHADA"` não podem ter suas divisões ou valores alterados sob nenhuma hipótese.
- **Registro Obrigatório de Alteração**: Qualquer modificação em divisões de despesas já consolidadas deve disparar uma notificação no log de auditoria do Tenant.

---

## Strategic Approach

### Strategic Approach

#### Solution Direction
- **Adaptação para Confiança Monitorada**: Manter a facilidade de inserção rápida de cartões e faturas, mas introduzir camadas de segurança que blindem os moradores contra desconfiança mútuas. A plataforma migra de um modelo de "Confiança Cega" para "Confiança Transparente", onde a flexibilidade descentralizada é protegida por um log de alterações visível.
- **Cálculo Proporcional Dinâmico no Frontend**: Implementar no assistente de criação (`NovoLancamentoWizard.vue`) a calculadora de rateio proporcional, puxando o `rendaCentavos` cadastrado, mas permitindo o ajuste pontual no momento da despesa.

#### Key Design Decisions
- **Decisão 1: Descarte da Aprovação de Despesas em Cartão de Terceiros**
  - *Trade-offs:* Exigir que o dono aprove toda compra que outro morador lança em seu cartão adiciona fricção excessiva à rotina diária doméstica. A dor de endividamento indesejado por parceiros é real, mas o fluxo de bloqueio/aprovação ingessa a dinâmica de confiança e compartilhamento.
  - *Recomendação:* Descartar a feature de aprovação de transação por custódia. Em vez disso, mitigamos o risco através do Log de Auditoria transparente, permitindo auditoria retroativa fácil, e o Mascaramento de Privacidade.
- **Decisão 2: Rastreabilidade Total vs. Privacidade Absoluta**
  - *Trade-offs:* Se o app permitir edição livre sem rastros, um usuário abusivo pode alterar valores retroativos de rateio sem o outro perceber (gerando disputas). Mas criar logs detalhados pode deixar o app pesado e burocrático.
  - *Recomendação:* Implementar uma tabela simplificada de `AuditLog` no banco de dados para registrar edições críticas (mudanças de renda, alteração de valores de gastos e exclusões). Isso protege as vítimas de abuso ou infidelidade financeira (que atinge **49%** dos casais) sem engessar as operações diárias.

#### Alternatives Considered
- **Bloqueio total de lançamentos descentralizados**: Considerou-se apenas permitir que o dono de cada cartão lance gastos nele. Rejeitado por ir contra a conveniência de compras rápidas do cotidiano residencial (ex: o parceiro que vai ao mercado com o cartão físico do outro).

---

## Risk & Gap Analysis

### Risk & Gap Analysis

#### Requirement Ambiguities
- **Definição de Proporcionalidade sobre Renda Zero**: Se nenhum morador tiver renda cadastrada ou a soma for zero, o sistema deve retroceder automaticamente para a divisão igualitária (50/50), informando isso de forma clara na UI.
- **Escopo do Mascaramento em Relatórios**: PDFs gerados para exportação de prestação de contas devem aplicar a mesma lógica de privacidade de descrição do backend, mantendo a descrição mascarada para membros não autorizados.

#### Edge Cases
- **O Centavo Sobrente (Rounding Errors)**: Em divisões proporcionais com dízimas (ex: 1/3 para R$100,00), o sistema deve destinar a diferença de centavos automaticamente ao membro com a maior renda declarada ou ao comprador, fechando o balanço sem discrepâncias no banco de dados.
- **Cartão Excluído com Fatura Aberta**: O que ocorre quando um morador exclui um cartão contendo compras parceladas ativas? O sistema deve migrar os gastos órfãos para uma "fatura virtual avulsa" associada ao morador devedor para não desequilibrar o netting global da moradia.

#### Technical Risks
- **Vazamento de Dados Privados pelo JSON**: Enviar as descrições originais de gastos privados e ocultá-las apenas por CSS ou JS no Vue 3 abre brechas para inspeção técnica via browser DevTools.
  - *Mitigação:* O mascaramento deve ser executado no backend (camada de Controller ou Interceptors do NestJS), substituindo a string de descrição antes de serializar o JSON de resposta para usuários não autorizados.

#### Acceptance Criteria Coverage

| AC# | Premissa / Dor de Mercado | Dados Reais de Mercado / Evidências | Addressable? | Gaps / Notas de Ajuste |
|-----|---------------------------|-------------------------------------|--------------|------------------------|
| 1   | Conflitos financeiros domésticos como vetor de ruptura. | **53% dos brasileiros** apontam as finanças como o principal motivo de brigas em relacionamentos amorosos (Serasa). | Sim | Mitigado pela calculadora de divisão proporcional, gerando um senso matemático objetivo de justiça distributiva. |
| 2   | Infidelidade financeira (esconder gastos/problemas). | **49% dos entrevistados** admitem já ter escondido problemas ou gastos financeiros do parceiro por medo de julgamento. | Sim | Endereçado pela flag `isPrivate`. Permite manter a integridade contábil do total sem expor o teor do gasto pessoal. |
| 3   | Insegurança por dívidas geradas pelo parceiro. | **41% já tiveram o CPF negativado** e **45% contraíram dívidas** por causa do parceiro (Serasa). | Sim | **Ajuste proposto:** Criar log de auditoria retroativa transparente para todas as movimentações e edições no Tenant, permitindo identificar lançamentos indesejados sem impor barreiras operacionais. |
| 4   | Dificuldade com orçamentos dinâmicos (freelancers/autônomos). | O mercado de trabalho informal e autônomo no Brasil representa cerca de **39%** da força de trabalho ativa (IBGE). | Sim | **Ajuste proposto:** Permitir alteração manual das rendas na calculadora de despesa de forma pontual (ad-hoc), sem alterar a renda base fixa do perfil. |
| 5   | Membros analógicos ou dependentes (crianças/pets). | Famílias reais possuem despesas centralizadas com dependentes que não usam apps. | Sim | Endereçado pelo modelo de `MembroCasa` virtual que permite o rateio contábil sem necessidade de credenciais de login. |
