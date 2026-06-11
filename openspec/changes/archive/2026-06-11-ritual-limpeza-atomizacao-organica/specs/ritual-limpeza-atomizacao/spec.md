## ADDED Requirements

### Requirement: Atomização da Interface de Configurações
O sistema SHALL desmembrar a tela de configurações em componentes modulares e independentes para reduzir a carga cognitiva e facilitar a manutenção.

#### Scenario: Navegação entre abas de configuração
- **WHEN** o usuário alterna entre as abas "Meu Perfil", "Controle de Acesso" e "Cargos"
- **THEN** o sistema SHALL carregar o componente especializado correspondente sem recarregar o estado global da tela

### Requirement: Padronização de Logs Técnicos
O sistema SHALL utilizar exclusivamente a abstração `logger.ts` para registros de eventos técnicos e erros, garantindo um formato consistente e silenciável para testes.

#### Scenario: Registro de erro em repositório
- **WHEN** uma falha de conexão ocorre em um repositório HTTP
- **THEN** o sistema SHALL registrar o erro através do `logger.error` no formato `[TIMESTAMP] [ERROR] Mensagem`

## REMOVED Requirements

### Requirement: Registro Manual de Acerto (Netting)
**Reason**: O registro manual de acerto de netting (botão "Pagar via PIX" no dashboard) foi identificado como um ponto de complexidade desnecessária que não reflete o fluxo real de uso dos moradores.
**Migration**: Manter apenas o cálculo de "Saldos Unificados" como informação passiva. O registro de pagamentos entre moradores deve ser feito como um lançamento comum se desejado, ou tratado externamente ao sistema.
