import { supabase } from './supabase'
import { TenantSessionService } from '../models/services/TenantSessionService'

// Repositórios Locais (LocalStorage)
import { LocalStorageMembroRepository } from '../models/repositories/local/LocalStorageMembroRepository'
import { LocalStorageCartaoRepository } from '../models/repositories/local/LocalStorageCartaoRepository'
import { LocalStorageFaturaRepository } from '../models/repositories/local/LocalStorageFaturaRepository'
import { LocalStorageGastoRepository } from '../models/repositories/local/LocalStorageGastoRepository'
import { LocalStorageContaFixaRepository } from '../models/repositories/local/LocalStorageContaFixaRepository'
import { LocalStorageAcertoMembroRepository } from '../models/repositories/local/LocalStorageAcertoMembroRepository'
import { LocalStorageEventStore } from '../models/repositories/local/LocalStorageEventStore'

// Repositórios Online (Supabase)
import { SupabaseMembroRepository } from '../models/repositories/supabase/SupabaseMembroRepository'
import { SupabaseCartaoRepository } from '../models/repositories/supabase/SupabaseCartaoRepository'
import { SupabaseFaturaRepository } from '../models/repositories/supabase/SupabaseFaturaRepository'
import { SupabaseGastoRepository } from '../models/repositories/supabase/SupabaseGastoRepository'
import { SupabaseContaFixaRepository } from '../models/repositories/supabase/SupabaseContaFixaRepository'
import { SupabaseAcertoMembroRepository } from '../models/repositories/supabase/SupabaseAcertoMembroRepository'
import { SupabaseEventStore } from '../models/repositories/supabase/SupabaseEventStore'

// Interfaces dos Repositórios
import type { IMembroRepository } from '../models/repositories/IMembroRepository'
import type { ICartaoRepository } from '../models/repositories/ICartaoRepository'
import type { IFaturaRepository } from '../models/repositories/IFaturaRepository'
import type { IGastoRepository } from '../models/repositories/IGastoRepository'
import type { IContaFixaRepository } from '../models/repositories/IContaFixaRepository'
import type { IAcertoMembroRepository } from '../models/repositories/IAcertoMembroRepository'
import type { IEventStore } from '../models/repositories/IEventStore'

// Serviços de Domínio
import { MembroService } from '../models/services/MembroService'
import { GastoService } from '../models/services/GastoService'
import { FaturaRolloverService } from '../models/services/FaturaRolloverService'
import { FaturaService } from '../models/services/FaturaService'
import { AcertoService } from '../models/services/AcertoService'
import { LedgerService } from '../models/services/LedgerService'
import { BootstrapEventGenerator } from '../models/services/BootstrapEventGenerator'
import { LancamentoService } from '../models/services/LancamentoService'
import { EstornoService } from '../models/services/EstornoService'

// 1. Instanciar o Serviço de Sessão do Supabase
export const tenantSessionService = new TenantSessionService(supabase)

// 2. Instanciar os Repositórios Físicos Locais
const localMembroRepo = new LocalStorageMembroRepository()
const localCartaoRepo = new LocalStorageCartaoRepository()
const localFaturaRepo = new LocalStorageFaturaRepository()
const localGastoRepo = new LocalStorageGastoRepository()
const localContaFixaRepo = new LocalStorageContaFixaRepository()
const localAcertoRepo = new LocalStorageAcertoMembroRepository()
const localEventStore = new LocalStorageEventStore()

// 3. Instanciar os Repositórios Físicos Supabase
const getActiveTenantId = () => tenantSessionService.getActiveTenantId() || ''
const getCurrentUserId = () => tenantSessionService.getCurrentUserId()

export const supabaseMembroRepo = new SupabaseMembroRepository(supabase, getActiveTenantId, getCurrentUserId)
export const supabaseCartaoRepo = new SupabaseCartaoRepository(supabase, getActiveTenantId)
export const supabaseFaturaRepo = new SupabaseFaturaRepository(supabase, getActiveTenantId)
export const supabaseGastoRepo = new SupabaseGastoRepository(supabase, getActiveTenantId)
export const supabaseContaFixaRepo = new SupabaseContaFixaRepository(supabase, getActiveTenantId)
export const supabaseAcertoRepo = new SupabaseAcertoMembroRepository(supabase, getActiveTenantId)
export const supabaseEventStore = new SupabaseEventStore(supabase, getActiveTenantId)

// 4. Factory Genérica para Repositórios Dinâmicos (Proxies)
function createDynamicRepo<T extends object>(local: T, supa: T): T {
  return new Proxy(local, {
    get(_, prop) {
      const active = tenantSessionService.isAuthenticated() ? supa : local
      const value = (active as any)[prop]
      if (typeof value === 'function') {
        return value.bind(active)
      }
      return value
    }
  })
}

// 5. Instanciar Repositórios Dinâmicos para a aplicação
export const membroRepository = createDynamicRepo<IMembroRepository>(localMembroRepo, supabaseMembroRepo)
export const cartaoRepository = createDynamicRepo<ICartaoRepository>(localCartaoRepo, supabaseCartaoRepo)
export const faturaRepository = createDynamicRepo<IFaturaRepository>(localFaturaRepo, supabaseFaturaRepo)
export const gastoRepository = createDynamicRepo<IGastoRepository>(localGastoRepo, supabaseGastoRepo)
export const contaFixaRepository = createDynamicRepo<IContaFixaRepository>(localContaFixaRepo, supabaseContaFixaRepo)
export const acertoMembroRepository = createDynamicRepo<IAcertoMembroRepository>(localAcertoRepo, supabaseAcertoRepo)
export const eventStore = createDynamicRepo<IEventStore>(localEventStore, supabaseEventStore)

// 6. Instanciar os Serviços de Domínio injetando os repositórios dinâmicos
export const lancamentoService = new LancamentoService(gastoRepository, faturaRepository, cartaoRepository, membroRepository)
export const estornoService = new EstornoService(gastoRepository, faturaRepository, acertoMembroRepository)

export const membroService = new MembroService(membroRepository, cartaoRepository, gastoRepository, faturaRepository, acertoMembroRepository)
export const gastoService = new GastoService(
  gastoRepository,
  faturaRepository,
  cartaoRepository,
  membroRepository,
  acertoMembroRepository,
  lancamentoService,
  estornoService
)
export const faturaService = new FaturaService(faturaRepository, acertoMembroRepository, gastoRepository)
export const faturaRolloverService = new FaturaRolloverService(faturaRepository, gastoRepository, faturaService)
export const acertoService = new AcertoService(acertoMembroRepository, faturaRepository, gastoRepository)
export const ledgerService = new LedgerService(eventStore)
export const bootstrapEventGenerator = new BootstrapEventGenerator(eventStore, gastoRepository)

import { MigrationService } from '../models/services/MigrationService'
export const migrationService = new MigrationService(
  supabase,
  localMembroRepo,
  localCartaoRepo,
  localFaturaRepo,
  localGastoRepo,
  localContaFixaRepo,
  localAcertoRepo,
  localEventStore
)
