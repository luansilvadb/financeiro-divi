# Plano de Implementação: Reestruturação Global para MVVM Estrito

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar e limpar a codebase do Divi organizando em camadas arquiteturais puras e desacoplando ViewModels de dependências físicas via interfaces e Composition Root.

**Architecture:** Mapeamento em pastas planas (`models/`, `viewmodels/`, `views/`, `shared/`), injeção de dependências em ViewModels via construtores/argumentos com fallbacks do container central (`src/shared/container.ts`), e aplicação de interfaces formais para serviços de domínio.

**Tech Stack:** Vue 3, TypeScript, Vitest, Vite

---

### Tarefa 1: Criação dos Contratos de Serviços de Domínio (Interfaces) (CONCLUÍDO)

Definir contratos formais (interfaces) para os serviços sob `src/models/services/`.

**Arquivos:**
- Criar: `src/models/services/IMembroService.ts`
- Criar: `src/models/services/IGastoService.ts`
- Criar: `src/models/services/IFaturaRolloverService.ts`
- Criar: `src/models/services/IFaturaService.ts`
- Criar: `src/models/services/IAcertoService.ts`

- [x] **Passo 1.1: Criar `src/models/services/IMembroService.ts`**
- [x] **Passo 1.2: Criar `src/models/services/IGastoService.ts`**
- [x] **Passo 1.3: Criar `src/models/services/IFaturaRolloverService.ts`**
- [x] **Passo 1.4: Criar `src/models/services/IFaturaService.ts`**
- [x] **Passo 1.5: Criar `src/models/services/IAcertoService.ts`**
- [x] **Passo 1.6: Executar testes de tipo**
- [x] **Passo 1.7: Commit parcial**

---

### Tarefa 2: Relocação Física dos Arquivos e Atualização dos Imports na Camada Model (EM ANDAMENTO)

Mover todos os arquivos de entidades, repositórios e serviços sob `src/modules/ledger/` para seus caminhos finais sob `src/models/`, e ajustar os imports internos de cada um.

**Arquivos:**
- Mover todos de `src/modules/ledger/model/domain/` para `src/models/entities/`
- Mover `src/shared/primitives/Dinheiro.ts` e seu teste para `src/models/entities/`
- Mover todos de `src/modules/ledger/model/repositories/` para `src/models/repositories/`
- Mover todos de `src/modules/ledger/infrastructure/local/` para `src/models/repositories/local/`
- Mover todos de `src/modules/ledger/model/services/` para `src/models/services/`

- [x] **Passo 2.1: Criar os diretórios de destino da Camada Model**
- [x] **Passo 2.2: Relocar Entidades de Domínio e Value Object**
- [x] **Passo 2.3: Relocar Interfaces de Repositórios**
- [/] **Passo 2.4: Relocar Implementações Locais de Repositórios**
  - Mover de `src/modules/ledger/infrastructure/local/` para `src/models/repositories/local/` (Feito)
  - Ajustar os imports relativos nos arquivos para apontarem para as novas entidades em `../../entities/*` e interfaces de repositórios em `../` (Em progresso)
- [ ] **Passo 2.5: Relocar e ajustar Serviços de Domínio**
  - Mover de `src/modules/ledger/model/services/` para `src/models/services/`
  - Fazer as classes de serviço implementarem formalmente suas respectivas interfaces.
    - Ex: Em `MembroService.ts`, adicione `import type { IMembroService } from './IMembroService'` e altere para `export class MembroService implements IMembroService`.
    - Repita para `GastoService.ts` (implementa `IGastoService`), `FaturaRolloverService.ts` (implementa `IFaturaRolloverService`), `FaturaService.ts` (implementa `IFaturaService`), `AcertoService.ts` (implementa `IAcertoService`).
  - Atualizar os imports internos dos serviços para usarem `../entities/` e `../repositories/`.
  - *Nota:* `NettingService.ts` não possui interface, pois é composto de funções puras determinísticas. Apenas atualizar seus imports.
- [ ] **Passo 2.6: Executar os testes unitários da camada Model**
  - Run: `npx vitest run src/models`
- [ ] **Passo 2.7: Commit**

---

### Tarefa 3: Criação do Composition Root (`src/shared/container.ts`)

Centralizar a instanciação física e configuração de injeção de dependências dos repositórios e serviços concretos.

**Arquivos:**
- Criar: `src/shared/container.ts`

- [ ] **Passo 3.1: Criar o arquivo `src/shared/container.ts`**
  Crie o arquivo com instâncias expostas prontas de todos os repositórios locais e de todos os serviços de domínio.
  ```typescript
  import { LocalStorageMembroRepository } from '../models/repositories/local/LocalStorageMembroRepository'
  import { LocalStorageCartaoRepository } from '../models/repositories/local/LocalStorageCartaoRepository'
  import { LocalStorageFaturaRepository } from '../models/repositories/local/LocalStorageFaturaRepository'
  import { LocalStorageGastoRepository } from '../models/repositories/local/LocalStorageGastoRepository'
  import { LocalStorageContaFixaRepository } from '../models/repositories/local/LocalStorageContaFixaRepository'
  import { LocalStorageAntecipacaoRepository } from '../models/repositories/local/LocalStorageAntecipacaoRepository'
  import { LocalStorageAcertoMembroRepository } from '../models/repositories/local/LocalStorageAcertoMembroRepository'

  import { MembroService } from '../models/services/MembroService'
  import { GastoService } from '../models/services/GastoService'
  import { FaturaRolloverService } from '../models/services/FaturaRolloverService'
  import { FaturaService } from '../models/services/FaturaService'
  import { AcertoService } from '../models/services/AcertoService'

  // Instanciamento dos Repositórios Físicos
  export const membroRepository = new LocalStorageMembroRepository()
  export const cartaoRepository = new LocalStorageCartaoRepository()
  export const faturaRepository = new LocalStorageFaturaRepository()
  export const gastoRepository = new LocalStorageGastoRepository()
  export const contaFixaRepository = new LocalStorageContaFixaRepository()
  export const antecipacaoRepository = new LocalStorageAntecipacaoRepository()
  export const acertoMembroRepository = new LocalStorageAcertoMembroRepository()

  // Instanciamento dos Serviços de Domínio (Injetando dependências)
  export const membroService = new MembroService(membroRepository)
  export const gastoService = new GastoService(gastoRepository, faturaRepository, cartaoRepository)
  export const faturaRolloverService = new FaturaRolloverService(faturaRepository, gastoRepository)
  export const faturaService = new FaturaService(faturaRepository, gastoRepository, antecipacaoRepository, acertoMembroRepository)
  export const acertoService = new AcertoService(acertoMembroRepository, faturaRepository)
  ```

- [ ] **Passo 3.2: Commit**

---

### Tarefa 4: Relocação e Ajuste das ViewModels (`src/viewmodels/`)

Mover as ViewModels, desacoplá-las dos arquivos físicos locais e vinculá-las apenas a interfaces e ao Composition Root. Mover as UI storages para `src/viewmodels/storage/`.

**Arquivos:**
- Mover todos de `src/modules/ledger/viewmodels/` para `src/viewmodels/`
- Mover `src/shared/utils/periodoStorage.ts` para `src/viewmodels/storage/periodoStorage.ts`
- Mover `src/shared/utils/rascunhoWizardStorage.ts` para `src/viewmodels/storage/rascunhoWizardStorage.ts`
- Mover `src/composables/useBottomSheetState.ts` para `src/viewmodels/useBottomSheetState.ts`

- [ ] **Passo 4.1: Criar pastas e mover os arquivos das ViewModels e Storages**
  Run: `mkdir -p src/viewmodels/storage`
  * Mova `src/shared/utils/periodoStorage.ts` para `src/viewmodels/storage/`
  * Mova `src/shared/utils/rascunhoWizardStorage.ts` para `src/viewmodels/storage/`
  * Mova `src/composables/useBottomSheetState.ts` para `src/viewmodels/useBottomSheetState.ts`
  * Mova todos os arquivos `src/modules/ledger/viewmodels/*` (produção e testes) para `src/viewmodels/`

- [ ] **Passo 4.2: Ajustar imports das storages de UI e de BottomSheetState**

- [ ] **Passo 4.3: Refatorar `useMembros.ts`**
  Modifique a ViewModel para aceitar injeção de dependência tipada nas interfaces e repositórios, com os fallbacks configurados no container.
  ```typescript
  import { ref, computed } from 'vue'
  import { Membro } from '../models/entities/Membro'
  import type { IMembroRepository } from '../models/repositories/IMembroRepository'
  import type { IMembroService } from '../models/services/IMembroService'
  import { membroRepository as defaultRepo, membroService as defaultService } from '../shared/container'

  export interface MembrosDependencies {
    membroRepository?: IMembroRepository
    membroService?: IMembroService
  }

  export function useMembros(deps: MembrosDependencies = {}) {
    const repository = deps.membroRepository ?? defaultRepo
    const service = deps.membroService ?? defaultService
    // ...
  ```

- [ ] **Passo 4.4: Refatorar `useCartoesEFaturas.ts`**
  ```typescript
  import type { ICartaoRepository } from '../models/repositories/ICartaoRepository'
  import type { IFaturaRepository } from '../models/repositories/IFaturaRepository'
  import type { IFaturaService } from '../models/services/IFaturaService'
  import { cartaoRepository as defaultCartaoRepo, faturaRepository as defaultFaturaRepo, faturaService as defaultFaturaService } from '../shared/container'

  export interface CartoesEFaturasDependencies {
    cartaoRepository?: ICartaoRepository
    faturaRepository?: IFaturaRepository
    faturaService?: IFaturaService
  }

  export function useCartoesEFaturas(deps: CartoesEFaturasDependencies = {}) {
    const cartaoRepo = deps.cartaoRepository ?? defaultCartaoRepo
    const faturaRepo = deps.faturaRepository ?? defaultFaturaRepo
    const faturaService = deps.faturaService ?? defaultFaturaService
    // ...
  ```

- [ ] **Passo 4.5: Refatorar as demais ViewModels**
  * `useContasFixas.ts`
  * `useDashboardViewModel.ts`
  * `useFaturaRollover.ts`
  * `useNovoLancamentoWizard.ts`
  * `useStorageSync.ts`

- [ ] **Passo 4.6: Ajustar arquivos de testes de ViewModels**
- [ ] **Passo 4.7: Rodar testes das ViewModels**
- [ ] **Passo 4.8: Commit**

---

### Tarefa 5: Relocação e Ajuste de Caminhos das Views e `src/App.vue`

Mover todas as views e componentes, dividindo-os de acordo com o nível de acoplamento ao domínio, e atualizar o app principal.

**Arquivos:**
- Mover todos de `src/components/ui/` para `src/views/components/ui/`
- Mover componentes de `src/components/ledger/` para `src/views/components/ledger/`
- Mover telas de `src/components/ledger/` para `src/views/screens/`
- Modificar: `src/App.vue` e seu teste `src/App.test.ts`
- Modificar: Todos os arquivos de visualização `.vue` para corrigir seus caminhos de importação.

- [ ] **Passo 5.1: Mover os arquivos para `src/views/`**
  Run: `mkdir -p src/views/components/ui src/views/components/ledger src/views/screens`
- [ ] **Passo 5.2: Corrigir imports nos componentes e telas movidos**
- [ ] **Passo 5.3: Atualizar `src/App.vue` e `src/App.test.ts`**
- [ ] **Passo 5.4: Rodar todos os testes de componentes**
- [ ] **Passo 5.5: Commit**

---

### Tarefa 6: Redução de Complexidade Ciclomática e Remoção de Código Morto

Limpar a codebase removendo diretórios órfãos, imports obsoletos e simplificando trechos de código com complexidade excessiva.

- [ ] **Passo 6.1: Identificar e refatorar trechos complexos nas ViewModels**
- [ ] **Passo 6.2: Remover arquivos mortos e diretórios vazios**
- [ ] **Passo 6.3: Executar a suíte completa de testes**
- [ ] **Passo 6.4: Commit**

---

### Tarefa 7: Verificação do Sistema

Garantir que a compilação de produção e a validação do TypeScript estejam íntegras.

- [ ] **Passo 7.1: Validar tipagens em toda a codebase**
- [ ] **Passo 7.2: Executar build de produção**
