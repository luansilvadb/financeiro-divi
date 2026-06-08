## Context

O Divi possui uma especificação detalhada de design para o perfil e configurações que prevê a separação em duas abas: "Meu Perfil" e "Controle de Acesso", utilizando uma barra de abas no estilo "Ilha Flutuante" (Floating Island). No entanto, a implementação atual de `ConfiguracoesMembros.vue` exibe uma lista monolítica com a listagem de moradores e cargos, sem a presença de abas e sem integrar o componente de cartões pessoais (`ConfiguracoesCartoes.vue`) existente. Esta proposta detalha a reestruturação da tela de configurações para introduzir o sistema de abas flutuantes e aninhar o cadastro de cartões na aba "Meu Perfil".

## Goals / Non-Goals

**Goals:**
- Criar a navegação de abas no formato "Floating Island" (Ilha Flutuante) dentro de `ConfiguracoesMembros.vue`.
- Organizar as telas em duas abas:
  - **Meu Perfil:** Informações do usuário logado (avatar orgânico, nome e username), botão de logout (estilo Tactile Pill) e gerenciamento de cartões de crédito pessoais (`ConfiguracoesCartoes.vue`).
  - **Controle de Acesso:** Lista de moradores ("Quem mora aqui") e painel de "Cargos e Permissões" (este último exibido apenas se o morador atual for administrador - `ADMIN`).
- Garantir a integridade da suíte de testes unitários com Vitest ajustando os stubs de renderização.

**Non-Goals:**
- Modificar esquemas de banco de dados (Prisma) ou rotas de API no backend (toda a lógica de backend para cartões e membros já está pronta e funcional).
- Permitir que moradores alterem ou excluam cartões de terceiros (a regra de negócio que restringe a manipulação de cartões ao seu respectivo dono deve ser mantida).

## Decisions

### 1. Sistema de Abas Floating Island
- **Abordagem:** Criar um seletor de abas (`activeTab = ref<'perfil' | 'acesso'>`) no topo de `ConfiguracoesMembros.vue`. O componente de abas terá estilo pílula arredondada, fundo translúcido (`bg-stone/10 backdrop-blur-md`) e indicador ativo com transição spring, respeitando a identidade visual "Family".
- **Alternativa Considerada:** Colocar os cartões em uma lista corrida na mesma tela.
- **Raciocínio:** Adotar abas evita sobrecarga cognitiva e respeita as especificações formais do projeto sobre navegação tátil de perfil.

### 2. Organização das Abas no Template
- **Aba "Meu Perfil":**
  - Exibe um bloco de identificação tátil (Card Inset) com `MembroAvatar`, Nome em Inter Bold e username.
  - Exibe o botão "Sair da Conta" com efeito de escala (Tactile Pill).
  - Renderiza o componente `<ConfiguracoesCartoes />`.
- **Aba "Controle de Acesso":**
  - Renderiza o card "Quem mora aqui" e suas lógicas de convite.
  - Renderiza "Cargos e Permissões" (se for ADMIN).
  
```
┌──────────────────────────────────────────────────┐
│              Configurações (Header)              │
├──────────────────────────────────────────────────┤
│           [ Meu Perfil ]   [ Controle Ac. ]      │ <-- Floating Island
├──────────────────────────────────────────────────┤
│  Se "Meu Perfil":                                │
│  ┌────────────────────────────────────────────┐  │
│  │ (Avatar) Luan Santos (admin)               │  │
│  │ @luan                                      │  │
│  │ [ Sair da Conta (Logout) ]                 │  │
│  └────────────────────────────────────────────┘  │
│  <ConfiguracoesCartoes />                        │
│                                                  │
│  Se "Controle de Acesso":                        │
│  - Lista de Moradores                            │
│  - Lista de Cargos (se ADMIN)                    │
└──────────────────────────────────────────────────┘
```

### 3. Ajuste na Cobertura de Testes
- **Abordagem:** Adicionar `ConfiguracoesCartoes` na lista de stubs do wrapper no arquivo de testes `ConfiguracoesMembros.test.ts` para isolar o comportamento de `ConfiguracoesMembros`.

## Risks / Trade-offs

- **[Risco]** Conflito de animações e múltiplos Bottom Sheets abertos (o formulário de novo cartão abre um Bottom Sheet interno, que ficará em cima do Bottom Sheet principal de configurações).
- **[Mitigação]** Garantir que a ordem de montagem (`z-index`) e o comportamento do composable de estado de Bottom Sheets do projeto (`useBottomSheetState`) sejam devidamente respeitados, para que o overlay não se sobreponha de forma inadequada. O componente `ConfiguracoesCartoes.vue` já utiliza o componente de UI `BottomSheet` padrão que gerencia o z-index corretamente de forma nativa.
