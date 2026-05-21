# Spec de Design: Reestruturação Global da Codebase para MVVM Estrito

Este documento especifica a refatoração e limpeza completa da codebase do Divi para o padrão **MVVM de Camadas Estritas**, removendo completamente a pasta intermediária de módulos e organizando os arquivos de acordo com suas responsabilidades arquiteturais puras.

---

## 1. Estrutura de Diretórios Final

Toda a codebase sob `src/` será organizada no seguinte formato plano de camadas:

```
src/
├── models/                     # Regras de negócio, dados e acesso a serviços externos
│   ├── entities/               # Entidades de domínio puro e Value Objects (Dinheiro)
│   ├── repositories/           # Interfaces (contratos) de acesso a dados
│   │   └── local/              # Implementações físicas de repositórios (LocalStorage)
│   └── services/               # Contratos e regras de serviço de domínio puro
│
├── viewmodels/                 # Lógica de apresentação, estado observável de tela
│   └── storage/                # Helpers de persistência de estado de UI (períodos, rascunhos)
│
├── views/                      # UI passiva
│   ├── components/
│   │   ├── ui/                 # Componentes visuais primitivos (zero acoplamento de domínio)
│   │   └── ledger/             # Componentes de domínio (acoplados às entidades)
│   └── screens/                # Telas completas da aplicação
│
└── shared/                     # Utilitários puros e agnósticos do domínio
    └── utils/                  # Formatadores genéricos, locks, etc.
```

---

## 2. Mapa Detalhado de Relocação de Arquivos

### 2.1 Camada Model

#### Entidades (`src/models/entities/`)
* `src/modules/ledger/model/domain/AcertoMembro.ts` $\rightarrow$ `src/models/entities/AcertoMembro.ts`
* `src/modules/ledger/model/domain/Antecipacao.ts` $\rightarrow$ `src/models/entities/Antecipacao.ts`
* `src/modules/ledger/model/domain/Cartao.ts` $\rightarrow$ `src/models/entities/Cartao.ts`
* `src/modules/ledger/model/domain/ContaFixa.ts` $\rightarrow$ `src/models/entities/ContaFixa.ts`
* `src/modules/ledger/model/domain/DivisaoDeGasto.ts` $\rightarrow$ `src/models/entities/DivisaoDeGasto.ts`
* `src/modules/ledger/model/domain/Fatura.ts` $\rightarrow$ `src/models/entities/Fatura.ts`
* `src/modules/ledger/model/domain/Gasto.ts` $\rightarrow$ `src/models/entities/Gasto.ts`
* `src/modules/ledger/model/domain/Membro.ts` $\rightarrow$ `src/models/entities/Membro.ts`
* `src/shared/primitives/Dinheiro.ts` $\rightarrow$ `src/models/entities/Dinheiro.ts`

#### Repositórios e Interfaces (`src/models/repositories/`)
* `src/modules/ledger/model/repositories/IAcertoMembroRepository.ts` $\rightarrow$ `src/models/repositories/IAcertoMembroRepository.ts`
* `src/modules/ledger/model/repositories/IAntecipacaoRepository.ts` $\rightarrow$ `src/models/repositories/IAntecipacaoRepository.ts`
* `src/modules/ledger/model/repositories/ICartaoRepository.ts` $\rightarrow$ `src/models/repositories/ICartaoRepository.ts`
* `src/modules/ledger/model/repositories/IContaFixaRepository.ts` $\rightarrow$ `src/models/repositories/IContaFixaRepository.ts`
* `src/modules/ledger/model/repositories/IFaturaRepository.ts` $\rightarrow$ `src/models/repositories/IFaturaRepository.ts`
* `src/modules/ledger/model/repositories/IGastoRepository.ts` $\rightarrow$ `src/models/repositories/IGastoRepository.ts`
* `src/modules/ledger/model/repositories/IMembroRepository.ts` $\rightarrow$ `src/models/repositories/IMembroRepository.ts`

#### Implementações Físicas (`src/models/repositories/local/`)
* `src/modules/ledger/infrastructure/local/LocalStorageAcertoMembroRepository.ts` $\rightarrow$ `src/models/repositories/local/LocalStorageAcertoMembroRepository.ts`
* `src/modules/ledger/infrastructure/local/LocalStorageAntecipacaoRepository.ts` $\rightarrow$ `src/models/repositories/local/LocalStorageAntecipacaoRepository.ts`
* `src/modules/ledger/infrastructure/local/LocalStorageCartaoRepository.ts` $\rightarrow$ `src/models/repositories/local/LocalStorageCartaoRepository.ts`
* `src/modules/ledger/infrastructure/local/LocalStorageContaFixaRepository.ts` $\rightarrow$ `src/models/repositories/local/LocalStorageContaFixaRepository.ts`
* `src/modules/ledger/infrastructure/local/LocalStorageFaturaRepository.ts` $\rightarrow$ `src/models/repositories/local/LocalStorageFaturaRepository.ts`
* `src/modules/ledger/infrastructure/local/LocalStorageGastoRepository.ts` $\rightarrow$ `src/models/repositories/local/LocalStorageGastoRepository.ts`
* `src/modules/ledger/infrastructure/local/LocalStorageMembroRepository.ts` $\rightarrow$ `src/models/repositories/local/LocalStorageMembroRepository.ts`

#### Serviços de Domínio (`src/models/services/`)
* **[NEW]** `IMembroService.ts`
* **[NEW]** `IGastoService.ts`
* **[NEW]** `IFaturaRolloverService.ts`
* **[NEW]** `IFaturaService.ts`
* **[NEW]** `IAcertoService.ts`
* `src/modules/ledger/model/services/AcertoService.ts` $\rightarrow$ `src/models/services/AcertoService.ts` *(Implementará `IAcertoService`)*
* `src/modules/ledger/model/services/FaturaRolloverService.ts` $\rightarrow$ `src/models/services/FaturaRolloverService.ts` *(Implementará `IFaturaRolloverService`)*
* `src/modules/ledger/model/services/FaturaService.ts` $\rightarrow$ `src/models/services/FaturaService.ts` *(Implementará `IFaturaService`)*
* `src/modules/ledger/model/services/GastoService.ts` $\rightarrow$ `src/models/services/GastoService.ts` *(Implementará `IGastoService`)*
* `src/modules/ledger/model/services/MembroService.ts` $\rightarrow$ `src/models/services/MembroService.ts` *(Implementará `IMembroService`)*
* `src/modules/ledger/model/services/NettingService.ts` $\rightarrow$ `src/models/services/NettingService.ts` *(Por ser composto apenas de funções matemáticas puras e determinísticas, não necessita de interface nem de instância no container de DI).*

### 2.2 Camada ViewModel (`src/viewmodels/`)

* `src/modules/ledger/viewmodels/useCartoesEFaturas.ts` $\rightarrow$ `src/viewmodels/useCartoesEFaturas.ts`
* `src/modules/ledger/viewmodels/useContasFixas.ts` $\rightarrow$ `src/viewmodels/useContasFixas.ts`
* `src/modules/ledger/viewmodels/useDashboardCalculations.ts` $\rightarrow$ `src/viewmodels/useDashboardCalculations.ts`
* `src/modules/ledger/viewmodels/useDashboardViewModel.ts` $\rightarrow$ `src/viewmodels/useDashboardViewModel.ts`
* `src/modules/ledger/viewmodels/useFaturaRollover.ts` $\rightarrow$ `src/viewmodels/useFaturaRollover.ts`
* `src/modules/ledger/viewmodels/useMembros.ts` $\rightarrow$ `src/viewmodels/useMembros.ts`
* `src/modules/ledger/viewmodels/useNovoLancamentoWizard.ts` $\rightarrow$ `src/viewmodels/useNovoLancamentoWizard.ts`
* `src/modules/ledger/viewmodels/useStorageSync.ts` $\rightarrow$ `src/viewmodels/useStorageSync.ts`
* `src/composables/useBottomSheetState.ts` $\rightarrow$ `src/viewmodels/useBottomSheetState.ts`

#### UI State Storage (`src/viewmodels/storage/`)
* `src/shared/utils/periodoStorage.ts` $\rightarrow$ `src/viewmodels/storage/periodoStorage.ts`
* `src/shared/utils/rascunhoWizardStorage.ts` $\rightarrow$ `src/viewmodels/storage/rascunhoWizardStorage.ts`

### 2.3 Camada View (`src/views/`)

#### Screens (`src/views/screens/`)
* `src/components/ledger/DashboardSaldos.vue` $\rightarrow$ `src/views/screens/DashboardSaldos.vue`
* `src/components/ledger/NovoLancamentoWizard.vue` $\rightarrow$ `src/views/screens/NovoLancamentoWizard.vue`
* `src/components/ledger/ConfiguracoesMembros.vue` $\rightarrow$ `src/views/screens/ConfiguracoesMembros.vue`

#### Components de UI Primitivos (`src/views/components/ui/`)
* `src/components/ui/BottomSheet.vue` $\rightarrow$ `src/views/components/ui/BottomSheet.vue`
* `src/components/ui/BottomTabBar.vue` $\rightarrow$ `src/views/components/ui/BottomTabBar.vue`
* `src/components/ui/Button.vue` $\rightarrow$ `src/views/components/ui/Button.vue`
* `src/components/ui/Card.vue` $\rightarrow$ `src/views/components/ui/Card.vue`
* `src/components/ui/SectionLabel.vue` $\rightarrow$ `src/views/components/ui/SectionLabel.vue`

#### Components de UI de Domínio (`src/views/components/ledger/`)
* `src/components/ledger/ActivityFeed.vue` $\rightarrow$ `src/views/components/ledger/ActivityFeed.vue`
* `src/components/ledger/BottomSheetAjustarGasto.vue` $\rightarrow$ `src/views/components/ledger/BottomSheetAjustarGasto.vue`
* `src/components/ledger/BottomSheetConfigurarContaFixa.vue` $\rightarrow$ `src/views/components/ledger/BottomSheetConfigurarContaFixa.vue`
* `src/components/ledger/ConfiguracoesCartoes.vue` $\rightarrow$ `src/views/components/ledger/ConfiguracoesCartoes.vue`
* `src/components/ledger/ContasFixasCard.vue` $\rightarrow$ `src/views/components/ledger/ContasFixasCard.vue`
* `src/components/ledger/ContasFixasPanel.vue` $\rightarrow$ `src/views/components/ledger/ContasFixasPanel.vue`
* `src/components/ledger/PopupLancarContaFixa.vue` $\rightarrow$ `src/views/components/ledger/PopupLancarContaFixa.vue`
* `src/components/ledger/shared/SeletorMembros.vue` $\rightarrow$ `src/views/components/ledger/SeletorMembros.vue`
* `src/components/ledger/dashboard/BottomSheetAcertoCompensacao.vue` $\rightarrow$ `src/views/components/ledger/dashboard/BottomSheetAcertoCompensacao.vue`
* `src/components/ledger/dashboard/BottomSheetFecharFatura.vue` $\rightarrow$ `src/views/components/ledger/dashboard/BottomSheetFecharFatura.vue`
* `src/components/ledger/dashboard/DetalhamentoSaldosCard.vue` $\rightarrow$ `src/views/components/ledger/dashboard/DetalhamentoSaldosCard.vue`

### 2.4 Camada Shared (`src/shared/`)

#### Utils (`src/shared/utils/`)
* `src/shared/utils/StorageLock.ts` $\rightarrow$ `src/shared/utils/StorageLock.ts`
* `src/shared/utils/cn.ts` $\rightarrow$ `src/shared/utils/cn.ts`
* `src/shared/utils/meses.ts` $\rightarrow$ `src/shared/utils/meses.ts`
* `src/shared/utils/formatarDinheiro.ts` $\rightarrow$ `src/shared/utils/formatarDinheiro.ts`

*(Todos os arquivos de teste `.test.ts` acompanham a relocação).*

---

## 3. Lógica de Desacoplamento e Composição (Bootstrap)

### 3.1 Criação das Interfaces dos Serviços de Domínio
Para desacoplar as ViewModels dos serviços concretos, definiremos contratos formais. Exemplo para `IMembroService`:

```typescript
// src/models/services/IMembroService.ts
import type { Membro } from '../entities/Membro'

export interface IMembroService {
  adicionarMembro(nome: string): Promise<Membro>
  desativarMembro(id: string): Promise<void>
  ativarMembro(id: string): Promise<void>
}
```

E a classe concreta implementará esta interface:

```typescript
// src/models/services/MembroService.ts
import type { IMembroService } from './IMembroService'
// ...
export class MembroService implements IMembroService {
  // ...
}
```

### 3.2 O Container de Composição (`src/shared/container.ts`)
Único ponto da codebase com permissão para importar de `local/` ou instanciar classes de serviços e repositórios diretamente.

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

---

## 4. Diretrizes de Qualidade do Código

### 4.1 Redução de Complexidade Ciclomática
Qualquer função ou método com complexidade ciclomática $\ge 5$ será refatorada. Ações principais:
* Substituição de condicionais aninhados por cláusulas de escape rápida (*early returns*).
* Extração de responsabilidades acessórias para sub-funções puras e curtas (máximo 20 linhas).

### 4.2 Remoção de Código Morto
Remoção estrita de imports não utilizados, código comentado, variáveis órfãs e hooks declarados sem consumo.

---

## 5. Plano de Verificação

### 5.1 Testes Automatizados
* Executar `npx vitest run` e certificar-se de que a migração de arquivos e rotas de imports manteve todos os 140 testes passando.

### 5.2 Build de Produção
* Executar `npm run build` para validar o compilador do TypeScript (`vue-tsc`) e o bundler do Vite, garantindo que não restou nenhuma quebra de referência relativa.
