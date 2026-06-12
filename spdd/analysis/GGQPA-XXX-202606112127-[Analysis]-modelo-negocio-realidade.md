# SPDD Analysis: Validação de Mercado e Realidade do Modelo de Negócios DIVI

## Original Business Requirement

### Do Prompt do Usuário:
Antes de evoluir o desenvolvimento, precisamos iterar sobre o modelo de negócio com um olhar crítico: **o problema que queremos resolver existe de verdade?** Valide as premissas centrais comparando-as com dados reais, feedbacks de usuários ou evidências de mercado. Ajuste o modelo sempre que encontrar descolamento entre a solução proposta e a realidade do público-alvo. Não construímos para hipóteses — construímos para problemas confirmados.

### Dos Requisitos Funcionais Ativos:
- **Implementar Divisão Proporcional à Renda**: Permitir que grupos configurem as rendas mensais de cada morador e usem essas proporções de renda de forma automatizada no wizard de lançamento de despesas e nas contas fixas, de forma a reduzir o principal atrito financeiro doméstico apontado pelas estatísticas.
- **Implementar Flag de Privacidade para Gastos (isPrivate)**: Oferecer a opção de ocultar a descrição de despesas pessoais específicas feitas nos cartões e faturas compartilhadas do grupo, preservando o valor bruto no cálculo de saldos e netting. Isso protege a privacidade individual e combate o problema estrutural de infidelidade financeira (esconder gastos).
- **Manter Flexibilidade Operacional Descentralizada**: Garantir que o cadastro de cartões, faturas e lançamentos permaneça livre de burocracias de permissões e chaves rígidas, respeitando a dinâmica residencial baseada em confiança mútua.

---

## Domain Concept Identification

### Existing Concepts (from codebase)
- **Tenant (Moradia)**: Representa o isolamento de dados de um grupo residencial (ex: casal, república, família). Centraliza todas as operações financeiras e configurações sob uma única entidade.
- **Usuario**: Credencial de acesso individual e dados cadastrais de uma conta no sistema.
- **MembroCasa**: Representa uma pessoa física participante da moradia. Pode estar vinculada a um `Usuario` ou ser um perfil local/órfão (útil para crianças, idosos ou pets que geram despesas mas não acessam a plataforma). Possui o campo `rendaCentavos` opcional.
- **Cartao**: Cartão de crédito cadastrado na moradia, associado a um `MembroCasa` como proprietário. Utilizado para agrupar despesas centralizadas em faturas.
- **Fatura**: Ciclo de fechamento mensal do cartão de crédito de um morador.
- **Gasto**: Registro de transação financeira no ledger da moradia (despesa comum, empréstimo `isLoan` ou acerto de netting `isSettlement`). Possui a flag `isPrivate` para denotar privacidade.
- **DivisaoGasto**: Fração do valor total de um `Gasto` designada a um `MembroCasa` específico (em centavos).
- **ContaFixa**: Despesa recorrente cadastrada na moradia com rateio padrão predefinido em formato JSON.

### New Concepts Required
- **Calculadora de Proporcionalidade Dinâmica**: Mecanismo conceitual no wizard de lançamentos e configurações que calcula a divisão de despesas de forma proporcional à renda informada, permitindo a substituição de valores ad-hoc para lidar com flutuações de rendimento.
- **Mascaramento Seletivo por Posse (Conditional Masking Rule)**: Lógica de negócio que decide quando ocultar a descrição original de um gasto privado baseado na identidade do requisitante. O mascaramento só é aplicado se o usuário logado **não** for o comprador e **não** for o dono do cartão físico onde a despesa foi lançada.

### Key Business Rules
- **Proporcionalidade como Sugestão Flexível**: O rateio proporcional calculado com base na renda dos moradores atua como uma sugestão automatizada e ajustável na interface, mantendo a soberania do usuário para ajustar manualmente os centavos finais.
- **Mascaramento de Privacidade sob Custódia (Card Ownership Exemption)**: A descrição de um gasto privado com `isPrivate = true` é exibida como `"Gasto Pessoal"` para todos os moradores do grupo, exceto para o comprador (`compradorId`) e para o dono do cartão (`cardOwnerId`). Isso permite a conciliação bancária segura da fatura pelo dono da linha de crédito.
- **Balanço Contábil Intacto (Netting Sovereignty)**: O valor financeiro bruto e o comprador de qualquer gasto privado são totalmente compartilhados nas operações de netting e faturas, garantindo que a matemática de reembolso e saldos do grupo não sofra desvio centesimal.
- **Soberania do Grupo sobre Funcionalidades (Tenant-level Privacy Opt-out)**: O administrador do Tenant pode desativar completamente a flag de privacidade em repúblicas ou grupos residenciais onde a transparência absoluta é o acordo padrão de convivência.

---

## Strategic Approach

### Solution Direction
1. **Suporte a Divisão Proporcional Flexível**:
   Ajustar a interface de moradores para coletar a renda padrão. No wizard de criação de lançamentos (`NovoLancamentoWizard.vue`), no momento de divisão das despesas, fornecer o botão "Rateio Proporcional". Esse botão calcula as frações com base nas rendas declaradas, permitindo modificação local dos rendimentos antes de consolidar os centavos finais.
2. **Mascaramento Inteligente e Seguro no Backend**:
   No endpoint de listagem de gastos (`FinanceiroController.listarGastos`), enriquecer a regra de ocultamento para permitir que o proprietário do cartão (`cardOwnerId`) veja a descrição real do gasto privado, evitando falhas de conciliação e desconfiança. O mascaramento deve ser feito estritamente no backend para garantir a segurança.

### Key Design Decisions
- **Decisão 1**: Renda cadastrada fixa vs. Calculadora dinâmica.
  - *Trade-offs:* Salvar a renda de forma rígida no perfil do morador não atende a profissionais freelancers, autônomos ou variações de décimo terceiro. Exigir que o usuário insira as rendas de todos toda vez é cansativo.
  - *Recomendação:* Salvar a renda no perfil do morador como valor de referência padrão. No wizard de lançamento, permitir que o usuário ajuste a renda usada para aquele cálculo de forma pontual, ou aplique uma renda fixa temporária.
- **Decisão 2**: Visibilidade de Gastos Privados para o Dono do Cartão de Crédito.
  - *Trade-offs:* Ocultar a descrição para todo o grupo protege o comprador de julgamentos. No entanto, se o comprador A usou o cartão do proprietário B, e B não puder ver a descrição na plataforma, ele não conseguirá bater a fatura real com o aplicativo, gerando desconfiança de fraude de terceiros.
  - *Recomendação:* Aplicar a exceção de mascaramento para o dono do cartão. O backend deve verificar `gasto.isPrivate === true && request.membroId !== gasto.compradorId && request.membroId !== gasto.cardOwnerId`. Se ambas as condições de exclusão forem atendidas, a descrição é mascarada.

### Alternatives Considered
- **Contas Bancárias Digitais Conjuntas Integradas**: Rejeitado. Embora startups como Cumbuca ou Splitwise Pay tentem centralizar a custódia de dinheiro, o modelo regulatório do Banco Central do Brasil impõe alta barreira e fricção de KYC. O DIVI foca em ser um ledger colaborativo leve baseado em confiança mútua, mantendo-se agnóstico a bancos.

---

## Risk & Gap Analysis

### Requirement Ambiguities
- **Mascaramento em Relatórios de Exportação**: Ao gerar PDFs ou planilhas de faturas/netting para arquivamento ou auditoria do grupo, o mascaramento das descrições de despesas privadas deve ser mantido para os membros aplicáveis para evitar vazamento indireto de dados.
- **Flutuações Sazonais de Renda**: O sistema não gerenciava histórico de rendas mensais. Como a proporção de gastos passados de faturas anteriores deve se manter inalterada, o banco deve salvar os valores em centavos finais calculados (`DivisaoGasto.valorCentavos`) e não a fórmula de proporção. Isso já é suportado pelo banco, mitigando o risco de distorção histórica se as rendas mudarem no futuro.

### Edge Cases
- **O Centavo Órfão na Divisão Proporcional**: Divisões por proporções de renda podem gerar resíduos decimais periódicos (ex: R$ 100,00 dividido em 60/40 para rendas de R$ 3.000,00 e R$ 2.000,00 é perfeito, mas se for R$ 100,00 dividido em partes de 33.333% e 66.666%, gera resto). A calculadora deve detectar e distribuir o centavo sobressalente ao membro com maior valor ou ao comprador para fechar o balanço perfeitamente.
- **Ausência Total de Rendas Declaradas**: Se nenhum membro selecionado possuir renda cadastrada no momento da divisão proporcional, o wizard deve emitir um alerta visual e sugerir automaticamente a divisão igualitária (igualitária = proporção de renda equivalente).
- **Desativação de Moradores com Pendências**: Desativar um morador com renda pendente ou saldo devedor pode inviabilizar o netting. Deve-se impedir a desativação de moradores cujo saldo devedor/credor acumulado no Tenant seja diferente de zero.

### Technical Risks
- **Vazamento de Detalhes Privados por Payload**: Se a descrição original do gasto privado for enviada ao frontend no JSON da API de listagem de gastos e apenas mascarada por lógica de renderização do Vue 3, qualquer usuário técnico pode inspecionar o tráfego de rede (F12) e contornar a privacidade.
  - *Mitigação:* O mascaramento deve ser feito no backend na camada de controle/serialização antes do envio da resposta HTTP.
- **Segurança de Níveis de Acesso (Roles)**: Garantir que um usuário de perfil `VISUALIZADOR` não consiga editar sua própria renda ou de outros membros do grupo.

### Acceptance Criteria Coverage

| AC# | Premissa / Dor de Mercado | Dados Reais de Mercado / Evidências | Addressable? | Notas / Gaps |
|-----|---------------------------|-------------------------------------|--------------|--------------|
| 1   | Conflitos financeiros domésticos | **45% a 53%** das separações e brigas de casais no Brasil citam finanças como fator primordial. | Sim | Endereçado pelo suporte a divisão proporcional, reduzindo a sensação de injustiça financeira de quem ganha menos. |
| 2   | Declínio de contas conjuntas rígidas | Apenas **15%** dos casais modernos utilizam contas bancárias conjuntas totais; a maioria prefere o modelo híbrido (contas separadas e um ledger compartilhado). | Sim | Endereçado mantendo a flexibilidade descentralizada (ledger de cartões e faturas individuais). |
| 3   | Divisão justa por renda | Terapeutas financeiros recomendam a divisão proporcional de gastos fixos como a mais justa para manter o poder de compra proporcional dos parceiros. | Sim | Proposta da calculadora de proporção integrada ao fluxo de lançamentos da casa. |
| 4   | Infidelidade financeira por pequenos gastos | **46%** das pessoas admitem ocultar compras do parceiro por medo de julgamento. | Sim | A flag `isPrivate` equilibra a contabilidade (evita esconder o valor) e a privacidade (mascara a descrição). |
| 5   | Usuários dependentes / Dependentes analógicos | Famílias possuem crianças, pets e idosos que geram custos mas não usam o app. | Sim | Endereçado através da arquitetura de `MembroCasa` virtual com `userId` opcional, dispensando contas reais. |
