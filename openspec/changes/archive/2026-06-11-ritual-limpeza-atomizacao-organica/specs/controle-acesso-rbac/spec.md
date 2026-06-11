## MODIFIED Requirements

### Requirement: Atribuição de Cargos (RBAC)
O sistema DEVE permitir a definição de papéis de acesso (ADMIN, MORADOR, VISUALIZADOR) para cada morador da casa, determinando quais ações ele pode executar no sistema de forma transparente. A lógica de atribuição DEVE ser centralizada em um `CargoService` no backend.

#### Scenario: Atribuir cargo de Administrador a outro membro
- **WHEN** um usuário logado com o papel de ADMIN altera o cargo de outro morador para Administrador no Bottom Sheet e clica em "Salvar Alterações"
- **THEN** o sistema atualiza o cargo do morador para ADMIN no banco de dados através do `CargoService` e propaga a alteração no frontend em tempo real via WebSocket

#### Scenario: Impedir que não-administrador altere cargos
- **WHEN** um usuário com papel de MORADOR ou VISUALIZADOR tenta fazer uma requisição para alterar cargos de membros
- **THEN** o sistema rejeita a operação com erro HTTP 403 (Forbidden) validado pelo `TenantRoleGuard`

#### Scenario: Impedir que o último administrador remova seu próprio cargo
- **WHEN** o único administrador ativo da casa tenta alterar seu próprio cargo para MORADOR ou VISUALIZADOR, ou tenta desativar a si mesmo no Bottom Sheet
- **THEN** o sistema bloqueia a alteração no frontend e backend através de regras de negócio no `MembroService`, exibindo uma mensagem de erro apropriada
