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
