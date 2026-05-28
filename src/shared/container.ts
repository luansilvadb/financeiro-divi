import { TenantSessionService } from '../models/services/TenantSessionService'

import { HttpMembroRepository } from '../models/repositories/http/HttpMembroRepository'
import { HttpCartaoRepository } from '../models/repositories/http/HttpCartaoRepository'
import { HttpFaturaRepository } from '../models/repositories/http/HttpFaturaRepository'
import { HttpGastoRepository } from '../models/repositories/http/HttpGastoRepository'
import { HttpContaFixaRepository } from '../models/repositories/http/HttpContaFixaRepository'
import { HttpAcertoMembroRepository } from '../models/repositories/http/HttpAcertoMembroRepository'

import { MembroService } from '../models/services/MembroService'
import { GastoService } from '../models/services/GastoService'
import { FaturaRolloverService } from '../models/services/FaturaRolloverService'
import { FaturaService } from '../models/services/FaturaService'
import { AcertoService } from '../models/services/AcertoService'
import { LancamentoService } from '../models/services/LancamentoService'
import { EstornoService } from '../models/services/EstornoService'

export const tenantSessionService = new TenantSessionService()

export const membroRepository = new HttpMembroRepository()
export const cartaoRepository = new HttpCartaoRepository()
export const faturaRepository = new HttpFaturaRepository()
export const gastoRepository = new HttpGastoRepository()
export const contaFixaRepository = new HttpContaFixaRepository()
export const acertoMembroRepository = new HttpAcertoMembroRepository()

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
