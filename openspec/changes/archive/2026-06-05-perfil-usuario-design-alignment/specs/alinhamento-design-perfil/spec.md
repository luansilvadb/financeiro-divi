## ADDED Requirements

### Requirement: Identidade Visual Family no Perfil
O sistema DEVE aplicar rigorosamente a identidade visual "Family" em todas as telas de perfil e configurações, utilizando o canvas `#fbfaf9`, tipografia `Fraunces` para títulos principais e o sistema de cores definido (ember, graphite, charcoal, etc).

#### Scenario: Visualização da tela de configurações
- **WHEN** o usuário abre a tela de configurações de membros
- **THEN** o sistema exibe o título principal "Perfil do Usuário" com a fonte `Fraunces` e o fundo da tela utiliza a cor canvas com textura de ruído

### Requirement: Avatares Orgânicos de Membros
Os avatares dos membros DEVEM ser representados por formas de "blob" orgânicas e animadas, utilizando as cores da paleta Family de forma aleatória ou associada ao membro, substituindo formas geométricas rígidas.

#### Scenario: Renderização do avatar do membro
- **WHEN** a lista de membros ou o perfil é carregado
- **THEN** o componente `MembroAvatar` renderiza uma forma orgânica (SVG ou CSS morphing) com uma das cores primárias da marca (ember, meadow, sky, sunburst, flamingo)

### Requirement: Navegação Floating Island
A alternância entre as abas "Meu Perfil" e "Controle de Acesso" DEVE seguir o padrão de "Ilha Flutuante", com fundo glassmorphism (`backdrop-blur`), bordas arredondadas e feedback visual tátil.

#### Scenario: Trocar de aba de configuração
- **WHEN** o usuário toca em uma das opções de aba
- **THEN** o indicador visual desliza suavemente com efeito de mola (`ease-spring`) e o fundo da barra de abas apresenta transparência com desfoque de fundo

### Requirement: Botões e Cards Táteis
Todos os botões DEVEM utilizar o estilo "Tactile Pills" com bordas arredondadas (`rounded-pill`) e animação de escala no clique. Os cards DEVEM utilizar o efeito de profundidade interna (`shadow-subtle`) sem sombras projetadas externas.

#### Scenario: Interação com botão de ação
- **WHEN** o usuário pressiona um botão (ex: "Sair da Conta" ou "Adicionar Morador")
- **THEN** o botão sofre uma redução de escala momentânea seguida de um retorno elástico, reforçando a sensação tátil
