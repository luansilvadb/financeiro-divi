## Context

O sistema DIVI cresceu organicamente, resultando em "God Components" e "God Services" que centralizam lógica de múltiplos domínios. A tela de configurações de membros e o serviço financeiro do backend são os principais gargalos de manutenção. Esta mudança visa restabelecer a saúde técnica através da atomização e saneamento de código morto.

## Goals / Non-Goals

**Goals:**
- Reduzir o tamanho de `ConfiguracoesMembros.vue` em pelo menos 60%.
- Fragmentar `FinanceiroService` em serviços de domínio coesos.
- Eliminar falhas sistemáticas nos testes de backend (`security.spec.ts`).
- Corrigir os testes de frontend que falham por ruído de log.
- Remover/Simplificar a funcionalidade de Netting conforme especificações anteriores.

**Non-Goals:**
- Mudanças no esquema do banco de dados (Prisma).
- Implementação de novas funcionalidades de negócio.
- Alteração visual drástica (o design deve ser mantido, apenas refatorado).

## Decisions

### 1. Desmembramento do Backend (NestJS)
**Decisão**: Fragmentar o `FinanceiroService` e o `FinanceiroController`.
- **MembroService**: Gestão de perfis e convites.
- **CargoService**: Gestão de cargos e permissões (RBAC).
- **CartaoService**: Gestão de cartões e faturas.
- **TransacaoService**: Gestão de gastos e acertos.
**Motivação**: Seguir o princípio de responsabilidade única e facilitar a manutenção e testes isolados.

### 2. Atomização da UI (Vue 3)
**Decisão**: Extrair sub-seções de `ConfiguracoesMembros.vue` para componentes em `src/views/components/settings/`.
- `PerfilUsuarioTab.vue`: Focado no usuário atual.
- `GestaoAcessoTab.vue`: Lista de membros e convites.
- `CargosTab.vue`: Definição de níveis de acesso.
**Motivação**: Melhorar a legibilidade e permitir que cada aba tenha seu ciclo de vida e estado mais claro.

### 3. Saneamento do Netting
**Decisão**: Remover a UI de "Ajuste de Netting" (registro manual de acerto) e manter apenas a visualização de "Saldos Unificados" como cálculo passivo.
**Motivação**: Alinhamento com a diretriz de "Exorcismo de Fantasmas" identificada na ausculta, onde o acerto manual via Netting estava gerando complexidade sem uso real.

### 4. Correção de Testes
**Decisão**:
- **Backend**: Atualizar `security.spec.ts` para usar o prefixo `/api` e garantir que o `JwtAuthGuard` seja testado em um contexto real.
- **Frontend**: Ajustar os mocks de `console.error` nos testes de `TenantSessionService` para aceitar o formato do `logger.ts`.

## Risks / Trade-offs

- **[Risco]** Quebra de comunicação em tempo real → **[Mitigação]** Garantir que todos os novos serviços continuem emitindo eventos via `FinanceiroGateway`.
- **[Risco]** Regressão em permissões → **[Mitigação]** Manter o `TenantRoleGuard` ativo e validar com testes de integração.
- **[Trade-off]** Mais arquivos para gerenciar → **[Justificativa]** A redução da carga cognitiva em cada arquivo individual compensa o aumento no número de arquivos.
