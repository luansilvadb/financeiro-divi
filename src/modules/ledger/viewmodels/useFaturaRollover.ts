import { Fatura } from '../model/domain/Fatura'
import { LocalStorageFaturaRepository } from '../infrastructure/local/LocalStorageFaturaRepository'
import { LocalStorageGastoRepository } from '../infrastructure/local/LocalStorageGastoRepository'
import { FaturaRolloverService } from '../model/services/FaturaRolloverService'
import type { IFaturaRepository } from '../model/repositories/IFaturaRepository'
import type { IGastoRepository } from '../model/repositories/IGastoRepository'

export interface RolloverDependencies {
  faturaRepository?: IFaturaRepository
  gastoRepository?: IGastoRepository
  faturaRolloverService?: FaturaRolloverService
}

export function useFaturaRollover(dependencies: RolloverDependencies = {}) {
  const fRepo = dependencies.faturaRepository || new LocalStorageFaturaRepository()
  const gRepo = dependencies.gastoRepository || new LocalStorageGastoRepository()
  const rolloverService = dependencies.faturaRolloverService || new FaturaRolloverService(fRepo, gRepo)

  const executarRolloverPeriodo = async (
    nomeNovoPeriodo: string,
    faturasAbertas: Fatura[],
    cartoes: any[],
    saldosAcumulados: Record<string, number>,
    nomePeriodoAnterior: string
  ) => {
    await rolloverService.executarRolloverPeriodo({
      nomeNovoPeriodo,
      faturasAbertas,
      cartoes,
      saldosAcumulados,
      nomePeriodoAnterior
    })
  }

  return {
    executarRolloverPeriodo
  }
}
