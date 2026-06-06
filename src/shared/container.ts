import { TenantSessionService } from '../models/services/TenantSessionService'
import { SocketService } from '../models/services/SocketService'

import { HttpMembroRepository } from '../models/repositories/http/HttpMembroRepository'
import { HttpCartaoRepository } from '../models/repositories/http/HttpCartaoRepository'
import { HttpFaturaRepository } from '../models/repositories/http/HttpFaturaRepository'
import { HttpGastoRepository } from '../models/repositories/http/HttpGastoRepository'
import { HttpContaFixaRepository } from '../models/repositories/http/HttpContaFixaRepository'
import { HttpCargoRepository } from '../models/repositories/http/HttpCargoRepository'


import { MembroService } from '../models/services/MembroService'
import { GastoService } from '../models/services/GastoService'
import { FaturaService } from '../models/services/FaturaService'
import { LancamentoService } from '../models/services/LancamentoService'

export const tenantSessionService = new TenantSessionService()

export const membroRepository = new HttpMembroRepository()
export const cartaoRepository = new HttpCartaoRepository()
export const faturaRepository = new HttpFaturaRepository()
export const gastoRepository = new HttpGastoRepository()
export const contaFixaRepository = new HttpContaFixaRepository()
export const cargoRepository = new HttpCargoRepository()

const lancamentoService = new LancamentoService(
  gastoRepository,
  faturaRepository,
  cartaoRepository
)

export const membroService = new MembroService(membroRepository)
export const gastoService = new GastoService(
  gastoRepository,
  faturaRepository,
  cartaoRepository,

  lancamentoService
)
export const faturaService = new FaturaService(faturaRepository)
export const socketService = new SocketService()
