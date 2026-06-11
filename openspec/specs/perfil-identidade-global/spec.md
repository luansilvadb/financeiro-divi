# Capability: perfil-identidade-global

## Purpose
TBD

## Requirements

### Requirement: Identidade Global (Nome de Exibição)
Todo usuário DEVE ter um Nome de Exibição armazenado globalmente em sua entidade `Usuario`, o qual será utilizado como default ao criar seu perfil `MembroCasa` em um Tenant.

#### Scenario: Cadastro define a identidade global
- **WHEN** o usuário cria a conta informando "Nome de Exibição"
- **THEN** o sistema salva o valor no campo `nome` do `Usuario`

#### Scenario: Criação de MembroCasa herda nome global
- **WHEN** o usuário entra em uma nova Casa (Tenant) via convite
- **THEN** o sistema cria o registro `MembroCasa` utilizando o `nome` do `Usuario` para preencher `MembroCasa.nome` automaticamente
