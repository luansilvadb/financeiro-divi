## Why

Atualmente, quando um usuário cria uma nova casa (tenant), ele apenas insere o nome da casa. Imediatamente após a criação, o aplicativo auto-popula contas fixas padrão (como aluguel e cuidados pet) de forma hardcoded e silenciosa. Isso impede a customização inicial e força dados que podem não fazer sentido para a casa (como cuidados com cachorro para quem não tem pet, ou aluguel para quem tem casa própria). Além disso, não há uma forma fácil de cadastrar os cartões de crédito de uso coletivo de forma guiada na entrada, prejudicando a adoção imediata da ferramenta.

## What Changes

- **Interface de Onboarding Guiada (Wizard)**: Substituição do formulário simples de criação de casa por um fluxo em 4 etapas no frontend:
  - **Passo 1 (Identidade)**: Nome da Casa (fluxo existente expandido).
  - **Passo 2 (Contas Fixas)**: Seleção de Contas Fixas Recorrentes recomendadas (Aluguel, Luz, Água, Internet, Pet, Limpeza), com opção de desmarcar, definir valores estimados ou adicionar contas personalizadas.
  - **Passo 3 (Cartões de Crédito)**: Cadastro opcional de Cartões de Crédito de uso coletivo (Nome do Cartão e Dia de Vencimento), onde o usuário logado que está criando a casa é configurado como o único responsável.
  - **Passo 4 (Sucesso)**: Tela de Sucesso com o código de convite gerado e opção de cópia rápida.
- **Fim da Auto-população Silenciosa**: Remoção da lógica de inicialização de contas padrão no frontend que insere registros caso o banco de dados esteja vazio, transferindo a sugestão destas contas para o Passo 2 do Wizard.
- **Segurança nos Cartões**: Garantia de que um cartão de crédito só possa ter como responsável padrão o próprio usuário autenticado que o cadastrou, impedindo a criação de cartões em nome de outros membros.

## Capabilities

### New Capabilities
- `onboarding-criacao-casa`: Capacidade que rege o fluxo guiado (wizard) para criação, parametrização de contas fixas e cartões de crédito da casa na entrada do usuário.

### Modified Capabilities
- `navegacao-global`: Pequenos ajustes na transição de telas para suportar o novo fluxo de onboarding antes de liberar o acesso à dashboard.

## Impact

- **Frontend (Vue 3 / Vite)**:
  - Alteração no `TenantSelectorScreen.vue` para suportar as etapas do Wizard de criação de casa.
  - Ajuste em `src/viewmodels/useContasFixas.ts` para desativar o salvamento silencioso de contas padrão.
  - Modificação nas chamadas de criação de contas e cartões para usarem os endpoints existentes do repositório.
- **Backend (NestJS / Prisma)**:
  - Reforço de segurança no endpoint de criação de cartões (`POST /financeiro/cartoes`) garantindo que o `responsavelPadraoId` pertença obrigatoriamente ao membro associado ao usuário logado na requisição.
