## MODIFIED Requirements

### Requirement: Acesso à Identidade Global via Navegação
O sistema DEVE permitir que o usuário acesse as configurações de seu perfil e identidade global através de componentes especializados integrados à navegação global.

#### Scenario: Acessar configurações de perfil pela aba
- **WHEN** o usuário toca na aba "Perfil" da navegação inferior
- **THEN** o sistema SHALL renderizar o componente `PerfilUsuarioTab.vue` dentro do container de configurações, exibindo dados de identidade global e cartões vinculados
