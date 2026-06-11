# onboarding-criacao-casa Specification

## Purpose
TBD - created by archiving change onboarding-melhoria-casa. Update Purpose after archive.
## Requirements
### Requirement: Fluxo Guiado de Criação de Casa (Wizard)
O sistema SHALL implementar um fluxo de onboarding estruturado em quatro passos no frontend ao optar por criar uma nova casa:
- **Passo 1 (Nome)**: O usuário digita o nome para a casa (limite de 60 caracteres).
- **Passo 2 (Contas Fixas)**: O usuário seleciona quais contas fixas recorrentes deseja configurar inicialmente a partir de uma lista sugerida (Aluguel, Luz, Água, Internet, Pet, Limpeza). Cada conta selecionada pode ter um valor fixo definido (em centavos) ou ser configurada como valor variável (nulo). O usuário também pode adicionar contas customizadas escolhendo nome, ícone (emoji) e valor.
- **Passo 3 (Cartões de Crédito)**: O usuário pode adicionar cartões de crédito vinculados à casa informando Nome do Cartão e Dia de Fechamento. O sistema associa implicitamente o usuário logado como o único responsável padrão (`responsavelPadraoId`) do cartão.
- **Passo 4 (Conclusão)**: O sistema exibe o nome da casa, o código de convite gerado e disponibiliza um botão para copiar o código, finalizando com o direcionamento para a Dashboard.

#### Scenario: Criar casa com parametrização completa
- **WHEN** o usuário passa por todas as etapas do wizard configurando o nome "República Central", selecionando "Luz" e "Internet (R$ 120,00)" e cadastrando um cartão "Nubank" (fechamento dia 10)
- **THEN** o sistema cria o tenant com sucesso, gera as contas fixas e o cartão com os parâmetros correspondentes e apresenta a tela de sucesso com o código de convite

#### Scenario: Criar casa sem nenhuma conta fixa ou cartão
- **WHEN** o usuário digita o nome no Passo 1, desmarca todas as contas fixas no Passo 2, ignora o cadastro de cartões no Passo 3 e avança
- **THEN** o sistema cria o tenant e direciona para a Dashboard com 0 contas fixas e 0 cartões associados no banco de dados

### Requirement: Restrição de Segurança no Cadastro de Cartões
O backend do sistema SHALL validar e forçar que o `responsavelPadraoId` de qualquer cartão de crédito criado ou editado por meio do endpoint `/financeiro/cartoes` seja obrigatoriamente o ID do perfil de membro correspondente ao usuário autenticado que efetuou a requisição.

#### Scenario: Tentar criar cartão definindo outro membro como responsável padrão
- **WHEN** o usuário logado com o perfil de membro A envia uma requisição `POST /financeiro/cartoes` com `responsavelPadraoId` apontando para o membro B
- **THEN** o sistema rejeita a requisição com um erro HTTP 400 Bad Request, impedindo a atribuição indevida de responsabilidade financeira

### Requirement: Inicialização sem Injeção Silenciosa
O frontend SHALL carregar as contas fixas da casa de forma direta a partir da API. Se a lista de contas fixas retornada estiver vazia, o sistema SHALL renderizar o estado de lista vazia sem inserir automaticamente registros pré-definidos no banco de dados.

#### Scenario: Acessar dashboard de uma casa sem contas fixas cadastradas
- **WHEN** o usuário acessa a dashboard de uma casa que não cadastrou contas fixas no onboarding
- **THEN** o sistema exibe a interface com o estado vazio em vez de injetar automaticamente contas padrão no banco de dados

