## Context

Atualmente, ao criar uma moradia (tenant) no DIVI, o processo é instantâneo e insere silenciosamente cinco contas fixas padrão (Aluguel, Luz, Água, Internet e Cachorro). Isso cria dados desnecessários ou inadequados para certas moradias (por exemplo, nem toda casa tem pet ou paga aluguel). O usuário também não é guiado na inserção de seus cartões de crédito compartilhados, dificultando o primeiro contato e a segurança desses cadastros.

## Goals / Non-Goals

**Goals:**
- Prover um Wizard de onboarding amigável e tátil em 4 etapas para criação e parametrização inicial da casa.
- Permitir a customização/exclusão de contas fixas recomendadas e adição de personalizadas no setup.
- Permitir o cadastro seguro de cartões de crédito coletivos pertencentes ao criador da casa no onboarding.
- Garantir a nível de backend que apenas o próprio usuário autenticado possa ser definido como o responsável padrão (`responsavelPadraoId`) de um cartão de crédito no momento do cadastro ou edição.
- Eliminar a injeção silenciosa de contas padrão do frontend.

**Non-Goals:**
- Convidar outros membros de forma ativa (envio de emails/SMS) durante o onboarding (o fluxo continuará sendo o compartilhamento manual do código de convite).
- Permitir cadastrar múltiplos membros na casa de forma fictícia/convidados durante esta fase (apenas o criador será cadastrado na largada).
- Permitir edição de permissões/cargos de membros nesta etapa.

## Decisions

### Decisão 1: Abordagem Frontend-First Incremental para Criação dos Recursos
- **Escolha**: O frontend cria a casa no Passo 1 (`POST /financeiro/tenants`) e recebe o ID do tenant e o ID de membro do criador. Nos Passos 2 e 3, conforme o usuário preenche o Wizard, o frontend cria as contas fixas e cartões utilizando os endpoints existentes (`POST /financeiro/contas-fixas` e `POST /financeiro/cartoes`) passando o ID do tenant no cabeçalho `X-Tenant-ID`.
- **Alternativa Considerada**: Enviar um payload atômico contendo tudo em um novo DTO no `POST /financeiro/tenants`.
- **Razão da Escolha**: Evita duplicar código no backend e estender desnecessariamente o DTO de criação do Tenant. Os repositórios do frontend (`contaFixaRepository`, `cartaoRepository`) já contam com toda a lógica de persistência e tratamento de erros.

### Decisão 2: Alteração no `useContasFixas.ts`
- **Escolha**: Remover a lógica de "auto-popular" do frontend. Se o repositório retornar vazio, apenas define `contasFixas.value = []`. O template de contas padrão será renderizado visualmente apenas na etapa 2 do Wizard de Onboarding, onde o usuário escolhe ativamente quais deseja persistir.
- **Razão da Escolha**: Respeita a intenção legítima do usuário de possuir uma casa sem contas fixas, resolvendo um bug conceitual e melhorando a separação de responsabilidades (a lógica de dados padrão pertence ao onboarding, não ao carregador genérico de dados).

### Decisão 3: Validação de Segurança de Cartão no Backend
- **Escolha**: Adicionar uma validação no `FinanceiroService.salvarCartao` que cruza o `responsavelPadraoId` enviado com o ID de membro do usuário autenticado no token JWT (que pode ser obtido buscando o `MembroCasa` pelo `userId` e `tenantId` da requisição). Se forem diferentes, lança `BadRequestException`.
- **Razão da Escolha**: Impede a criação de registros financeiros em nome de terceiros de forma maliciosa ou errônea, garantindo integridade de dados.

## Risks / Trade-offs

- **[Risco] Abandono do Wizard**: Se o usuário fechar o navegador após o Passo 1, a casa terá sido criada no banco de dados, mas sem a parametrização de contas e cartões.
  - **Mitigação**: O redirecionamento no login continuará identificando que a casa possui 0 contas fixas e 0 cartões, e a tela inicial (Hoje) oferecerá atalhos amigáveis para cadastrá-los, não quebrando o aplicativo. Além disso, se ele tentar criar outra casa, passará pelo fluxo normalmente.
