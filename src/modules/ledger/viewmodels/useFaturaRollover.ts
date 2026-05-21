import { Fatura } from '../core/domain/Fatura'
import { LocalStorageFaturaRepository } from '../adapters/LocalStorageFaturaRepository'
import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
import { FaturaRolloverService } from '../core/services/FaturaRolloverService'
import type { IFaturaRepository } from '../core/ports/IFaturaRepository'
import type { IGastoRepository } from '../core/ports/IGastoRepository'

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
