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

// Entidades de Domínio
import type { Membro } from '../models/entities/Membro'
import type { Cartao } from '../models/entities/Cartao'
import type { Fatura, FaturaPeriodo } from '../models/entities/Fatura'
import type { Gasto } from '../models/entities/Gasto'
import type { ContaFixa } from '../models/entities/ContaFixa'
import type { AcertoMembro } from '../models/entities/AcertoMembro'
import type { LedgerEvent } from '../models/entities/LedgerEvent'

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

// 4. Implementar Classes Wrappers Dinâmicas (Proxies)
class DynamicMembroRepository implements IMembroRepository {
  private get active() { return tenantSessionService.isAuthenticated() ? supabaseMembroRepo : localMembroRepo }
  async salvar(m: Membro) { return this.active.salvar(m) }
  async listarTodos() { return this.active.listarTodos() }
  async buscarPorId(id: string) { return this.active.buscarPorId(id) }
}

class DynamicCartaoRepository implements ICartaoRepository {
  private get active() { return tenantSessionService.isAuthenticated() ? supabaseCartaoRepo : localCartaoRepo }
  async buscarPorId(id: string) { return this.active.buscarPorId(id) }
  async salvar(c: Cartao) { return this.active.salvar(c) }
  async listarTodos() { return this.active.listarTodos() }
  async excluir(id: string) { return this.active.excluir(id) }
}

class DynamicFaturaRepository implements IFaturaRepository {
  private get active() { return tenantSessionService.isAuthenticated() ? supabaseFaturaRepo : localFaturaRepo }
  async buscarPorId(id: string) { return this.active.buscarPorId(id) }
  async buscarPorCartaoEPeriodo(cId: string, p: FaturaPeriodo) { return this.active.buscarPorCartaoEPeriodo(cId, p) }
  async salvar(f: Fatura) { return this.active.salvar(f) }
  async salvarMuitas(f: Fatura[]) { return this.active.salvarMuitas(f) }
  async listarTodas() { return this.active.listarTodas() }
  async executarMigracoesEDesduplicacao() { return this.active.executarMigracoesEDesduplicacao() }
  async assegurarObterOuCriarFatura(cId: string, m: number, a: number, rId: string) { return this.active.assegurarObterOuCriarFatura(cId, m, a, rId) }
  async excluirFaturasAbertasSemGastosPorCartao(cId: string) { return this.active.excluirFaturasAbertasSemGastosPorCartao(cId) }
}

class DynamicGastoRepository implements IGastoRepository {
  private get active() { return tenantSessionService.isAuthenticated() ? supabaseGastoRepo : localGastoRepo }
  async salvar(g: Gasto) { return this.active.salvar(g) }
  async salvarMuitos(g: Gasto[]) { return this.active.salvarMuitas(g) }
  async buscarPorFatura(fId: string) { return this.active.buscarPorFatura(fId) }
  async buscarPorId(id: string) { return this.active.buscarPorId(id) }
  async excluir(id: string) { return this.active.excluir(id) }
  async excluirMuitos(ids: string[]) { return this.active.excluirMuitos(ids) }
  async listarTodos() { return this.active.listarTodos() }
}

class DynamicContaFixaRepository implements IContaFixaRepository {
  private get active() { return tenantSessionService.isAuthenticated() ? supabaseContaFixaRepo : localContaFixaRepo }
  async listarTodas() { return this.active.listarTodas() }
  async salvar(cf: ContaFixa) { return this.active.salvar(cf) }
  async excluir(id: string) { return this.active.excluir(id) }
}

class DynamicAcertoMembroRepository implements IAcertoMembroRepository {
  private get active() { return tenantSessionService.isAuthenticated() ? supabaseAcertoRepo : localAcertoRepo }
  async buscarPorId(id: string) { return this.active.buscarPorId(id) }
  async buscarPorFatura(fId: string) { return this.active.buscarPorFatura(fId) }
  async salvar(am: AcertoMembro) { return this.active.salvar(am) }
  async excluirPorFatura(fId: string) { return this.active.excluirPorFatura(fId) }
  async listarTodos() { return this.active.listarTodos() }
}

class DynamicEventStore implements IEventStore {
  private get active() { return tenantSessionService.isAuthenticated() ? supabaseEventStore : localEventStore }
  async append(events: LedgerEvent[]) { return this.active.append(events) }
  async getStream() { return this.active.getStream() }
  async clear() { return this.active.clear() }
}

// 5. Instanciar Repositórios Dinâmicos para a aplicação
export const membroRepository = new DynamicMembroRepository()
export const cartaoRepository = new DynamicCartaoRepository()
export const faturaRepository = new DynamicFaturaRepository()
export const gastoRepository = new DynamicGastoRepository()
export const contaFixaRepository = new DynamicContaFixaRepository()
export const acertoMembroRepository = new DynamicAcertoMembroRepository()
export const eventStore = new DynamicEventStore()

// 6. Instanciar os Serviços de Domínio injetando os repositórios dinâmicos
export const membroService = new MembroService(membroRepository, cartaoRepository, gastoRepository, faturaRepository, acertoMembroRepository)
export const gastoService = new GastoService(gastoRepository, faturaRepository, cartaoRepository, membroRepository, acertoMembroRepository)
export const faturaService = new FaturaService(faturaRepository, acertoMembroRepository, gastoRepository)
export const faturaRolloverService = new FaturaRolloverService(faturaRepository, gastoRepository, faturaService)
export const acertoService = new AcertoService(acertoMembroRepository, faturaRepository, gastoRepository)
export const ledgerService = new LedgerService(eventStore)
export const bootstrapEventGenerator = new BootstrapEventGenerator(eventStore, gastoRepository)
