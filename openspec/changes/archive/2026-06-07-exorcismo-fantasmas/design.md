## Context

O frontend do Divi segue uma arquitetura MVVM limpa: `views/` → `viewmodels/` → `models/services/` → `models/repositories/`. O container DI manual (`shared/container.ts`) instancia services e repositories com `new` explícito. Os repositories seguem interfaces (`I*Repository`) que são mockadas nos testes. Os services também possuem interfaces (`IGastoService`, `IFaturaService`, `IMembroService`), mas cada uma tem **exatamente uma implementação** e nenhuma é usada para mock — os testes mockam diretamente os repositórios.

A lógica de resolução de cartão (buscar cartão por ID ou `responsavelPadraoId`, fallback para `PIX_DEFAULT_ID`) aparece duplicada em 3 pontos de `GastoService` e 1 ponto de `LancamentoService`. Os viewmodels usam `ref<any | null>` em 4 posições onde o tipo real é conhecido.

## Goals / Non-Goals

**Goals:**
- Eliminar arquivos que não possuem referência ativa no codebase (asset, docs, benchmark)
- Remover abstrações cerimoniais que existem sem justificativa prática (interfaces 1:1)
- Consolidar lógica de resolução de cartão em uma função pura reutilizável
- Restaurar tipagem forte nos viewmodels, eliminando `any` onde o tipo é conhecido

**Non-Goals:**
- Não alterar a arquitetura MVVM existente
- Não tocar nas interfaces de Repository (`I*Repository`) — estas são mockadas nos testes
- Não modificar o backend (exceto deletar o benchmark fossilizado)
- Não alterar o esquema Prisma
- Não modificar comportamento funcional do sistema — zero mudança observável pelo usuário
- Não atacar o monólito `financeiro.service.ts` do backend (fica para uma change futura)
- Não refatorar a entidade `Gasto` (union types seria uma change própria)

## Decisions

### 1. Função pura `resolverCartao` em arquivo dedicado

**Decisão**: Criar `src/models/services/CartaoResolver.ts` com uma função pura exportada.

**Alternativas consideradas**:
- *Método estático em `Cartao` entity*: Rejeitado — a entidade `Cartao` é um value object puro. Adicionar lógica de resolução que depende de uma lista de cartões quebraria a responsabilidade.
- *Método privado em `GastoService`*: Rejeitado — `LancamentoService` também precisa da mesma lógica, e não faz sentido duplicar ou criar acoplamento entre os dois services.
- *Módulo em `shared/utils/`*: Rejeitado — é lógica de domínio financeiro, não utilitário genérico. Pertence à camada de models/services.

**Assinatura proposta**:
```typescript
interface CartaoResolvido {
  cartaoId: string        // ID do cartão, ou 'PIX_DEFAULT_ID'
  cardOwner: string | null // responsavelPadraoId, ou null
  responsavelFaturaId: string // quem paga a fatura
}

function resolverCartao(
  method: 'pix' | 'card',
  cardOwnerId: string | null,
  compradorId: string,
  todosCartoes: Cartao[]
): CartaoResolvido
```

### 2. Remoção das interfaces de Service sem substituição

**Decisão**: Deletar `IGastoService.ts`, `IFaturaService.ts`, `IMembroService.ts` e a interface `ILancamentoService` inline. Os consumidores passam a referenciar as classes diretamente.

**Alternativas consideradas**:
- *Manter interfaces para "preparação futura"*: Rejeitado — YAGNI. Se surgir necessidade de polimorfismo, criar a interface nesse momento leva 2 minutos. O custo de manter código cerimonial é contínuo.
- *Consolidar tipos exportados nas interfaces*: Os tipos (`LancarGastoInput`, `NettingInput`, etc.) definidos em `IGastoService.ts` serão movidos para os arquivos das classes que os consomem.

### 3. Tipagem explícita nos viewmodels com imports das entities

**Decisão**: Substituir `ref<any | null>` por `ref<Gasto | null>`, `ref<ContaFixa | null>`, etc. Tipar callbacks com interfaces nomeadas.

**Rationale**: Os tipos já existem no codebase. O `any` não foi uma decisão de design — foi pressa.

## Risks / Trade-offs

- **[Risco] Imports quebrados após remoção de interfaces** → Mitigação: grep por todo import de `IGastoService`, `IFaturaService`, `IMembroService` antes de deletar. Atualizar cada referência. Compilar com `vue-tsc` para validar.
- **[Risco] Tipos exportados das interfaces perdem-se** → Mitigação: `LancarGastoInput` e `NettingInput` de `IGastoService.ts` serão relocados para `GastoService.ts` ou arquivo próprio de tipos.
- **[Trade-off] Perda de "documentação implícita" das interfaces** → Aceitável: as classes TypeScript já servem como contrato. A interface 1:1 não adicionava informação que a classe não contivesse.
