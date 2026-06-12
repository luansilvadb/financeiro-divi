# SPDD Analysis: Análise Crítica de Roles e Permissões (RBAC) no DIVI

## Original Business Requirement

> /spdd-analysis precisamos iterar sobre as roles e permissões RBAC com um olhar crítico: as permissões existentes são uteis e entregam valor para o app atualmente ? Valide as premissas centrais.

---

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Role (enum ADMIN / MORADOR / VISUALIZADOR)**: O nível de permissão sistêmica estrutural de cada membro em uma moradia (`MembroCasa`).
- **MembroCasa**: O perfil do usuário associado a um Tenant específico (moradia).
- **Tenant (Moradia)**: O agrupamento lógico isolado de cartões, faturas, gastos e membros.
- **AuditLog**: Histórico detalhado de alterações administrativas e financeiras ocorridas dentro da moradia.
- **Ações Financeiras**: Lançamento de despesas, cadastramento de cartões de crédito, criação de faturas e gerenciamento de contas fixas.

### New Concepts Required

- **Nenhum**. O objetivo desta iteração é refinar a utilidade e a arquitetura das permissões das Roles sistêmicas atuais.

### Key Business Rules

- **Autonomia Operacional**: Tanto `ADMIN` quanto `MORADOR` têm permissão total de escrita para operações financeiras (lançar gastos, criar faturas, gerenciar cartões e contas fixas).
- **Soberania Administrativa**: Apenas `ADMIN` pode gerenciar moradores (adicionar, remover, ativar/desativar, rebaixar/promover roles) e visualizar o faturamento da moradia (`GET /validacao/status`).
- **Observabilidade Exclusiva**: Apenas `ADMIN` tem acesso à listagem de logs de auditoria (`GET /audit-logs`).
- **Prevenção de Orfandade**: O último `ADMIN` ativo da moradia não pode ser desativado ou rebaixado para garantir que a moradia sempre tenha um responsável administrativo.
- **Consumo Passivo**: O `VISUALIZADOR` tem privilégios de somente leitura nas rotas financeiras (`GET`).

---

## Strategic Approach

### Solution Direction

A análise crítica das Roles no DIVI revela que o modelo atual com três papéis (`ADMIN`, `MORADOR`, `VISUALIZADOR`) é conceitualmente simples, adequado para ambientes residenciais e não gera a complexidade cognitiva que os Cargos causavam. No entanto, algumas premissas de permissões herdadas do modelo corporativo merecem revisão:

1. **Paridade Operacional (ADMIN vs. MORADOR)**:
   * **Premissa**: Em uma moradia compartilhada, os moradores operam com base na confiança mútua. Não faz sentido exigir aprovação ou bloquear o morador de cadastrar cartões, lançar gastos ou criar faturas.
   * **Validação**: Premissa totalmente válida. A autonomia operacional do `MORADOR` deve ser mantida.

2. **Gargalo de Transparência no Histórico de Auditoria**:
   * **Premissa**: Apenas o `ADMIN` deve auditar as alterações na moradia para garantir a segurança dos logs.
   * **Validação (Descolamento de Negócio)**: Em finanças colaborativas de alta confiança (como repúblicas ou casais), a transparência completa é a chave para evitar conflitos. Se um gasto for excluído ou editado por engano, o `MORADOR` comum precisa rastrear essa ação para corrigir o erro. Negar-lhe acesso ao log de auditoria operacional gera atritos sociais ("quem apagou meu gasto?") e obriga o usuário a solicitar o log ao `ADMIN`, criando gargalos burocráticos artificiais.
   * **Recomendação**: Flexibilizar a rota `GET /audit-logs` para permitir acesso a `MORADORES` (alterando de `@Roles(Role.ADMIN)` para `@Roles(Role.ADMIN, Role.MORADOR)`). A auditoria doméstica deve ser uma ferramenta de transparência colaborativa, não de sigilo.

3. **Papel de VISUALIZADOR (Somente Leitura)**:
   * **Premissa**: Há cenários em que um participante quer apenas monitorar as finanças sem capacidade de escrita.
   * **Validação**: Premissa válida, mas de nicho. Casos confirmados incluem pais financiando repúblicas de estudantes, filhos menores ou fiadores. O controle rigoroso de escrita e a ausência de privilégios operacionais se justificam para evitar adulterações por participantes externos.

---

### Key Design Decisions

#### Decisão 1: Permitir acesso aos Logs de Auditoria para a Role MORADOR
- **Alternativa A (Manter atual)**: Apenas `ADMIN` pode consultar logs de auditoria.
  - *Razão de Rejeição*: Bloqueia a transparência diária em um ambiente familiar. Se um cônjuge ou colega de república excluir um gasto, o outro morador não consegue verificar quem fez a exclusão, exigindo intermediação burocrática do Admin.
- **Alternativa B (Recomendada - Transparência Total)**: Expandir a permissão do endpoint `GET /audit-logs` para `@Roles(Role.ADMIN, Role.MORADOR)`.
  - *Rationale*: Fortalece o valor de colaboração e confiança mútua do DIVI, permitindo que qualquer morador audite discrepâncias e resolva dúvidas de lançamentos diretamente na UI.

#### Decisão 2: Manter a restrição de gerenciamento de membros exclusiva ao ADMIN
- **Premissa**: Apenas o `ADMIN` cria novos convites e suspende membros.
  - *Rationale*: Necessário por governança técnica. O `ADMIN` é o criador da moradia e o responsável comercial pela assinatura ou limites da conta. Permitir que moradores suspam outros moradores geraria riscos de exclusão abusiva em disputas residenciais.

---

### Alternatives Considered

- **Substituir a Role VISUALIZADOR por uma permissão de "Gasto Pessoal"**: Rejeitado. O `VISUALIZADOR` precisa monitorar o extrato completo da casa, o que é conceitualmente diferente de um `MORADOR` que apenas tem gastos privados restritos.
- **Criar uma Role intermediária "Financeiro"**: Rejeitado. Geraria a mesma complexidade e sobreposição que os Cargos removidos causavam.

---

## Risk & Gap Analysis

### Requirement Ambiguities

- **Privacidade de Logs**: Embora dar acesso à auditoria para moradores aumente a transparência, alguns logs administrativos confidenciais (como alteração de Roles ou exclusão de membros) também ficarão visíveis para eles.
  - *Impacto*: Em ambientes domésticos, isso é geralmente aceitável e até desejável. Mas a visualização na UI pode ser filtrada se necessário.

### Edge Cases

- **Membro rebaixado para Visualizador**: Perde imediatamente o acesso a todas as rotas de alteração financeira, mas deve continuar vendo o histórico das suas próprias despesas antigas.
- **Morador desativado**: Perde completamente o acesso de leitura e escrita. O histórico de logs associados ao seu ID continua preservado no banco para auditoria futura do grupo.

### Technical Risks

- **Ajuste no Guard de Auditoria**: Exige a modificação no backend do decorator da rota de auditoria em `FinanceiroController`.
- **Ajustes de UI no Frontend**: A visualização da aba ou botão de logs de auditoria na UI precisará ser liberada para a Role `MORADOR` se antes estava restrita apenas ao Admin.

### Acceptance Criteria Coverage

| AC# | Descrição da Premissa / Requisito | Avaliação de Valor | Addressable? | Gaps/Notas |
|-----|-----------------------------------|-------------------|--------------|------------|
| 1 | Roles existentes são úteis? | **Sim**. A distinção básica entre Admin (gerenciamento), Morador (operação) e Visualizador (leitura) cobre 100% dos cenários residenciais sem complexidade. | Sim | Modelo simplificado consolidado. |
| 2 | O Admin de governança é útil? | **Sim**. Evita conflito administrativo e centraliza a assinatura comercial do grupo. | Sim | Parâmetro de segurança e comercial essencial. |
| 3 | O Visualizador entrega valor? | **Sim**. Caso de uso para terceiros pagadores/financiadores (ex: pais, fiador). | Sim | Caso de uso confirmado, embora secundário. |
| 4 | O Morador tem paridade operacional? | **Sim**. Reduz a fricção e apoia a premissa de que a governança de gastos se resolve na confiança e comunicação da casa. | Sim | Central para a experiência de produto do DIVI. |
| 5 | A restrição de auditoria ao Admin agrega valor? | **Não**. Cria um gargalo burocrático e gera desconfiança sobre alterações de gastos domésticos comuns. | Parcial | Gap detectado. Recomenda-se expandir o acesso ao log para a role `MORADOR`. |
