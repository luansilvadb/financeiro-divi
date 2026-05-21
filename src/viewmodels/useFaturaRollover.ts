import { Fatura } from '../models/entities/Fatura'
import type { IFaturaRepository } from '../models/repositories/IFaturaRepository'
import type { IGastoRepository } from '../models/repositories/IGastoRepository'
import type { IFaturaRolloverService } from '../models/services/IFaturaRolloverService'
import { faturaRolloverService } from '../shared/container'

export interface RolloverDependencies {
  faturaRepository?: IFaturaRepository
  gastoRepository?: IGastoRepository
  faturaRolloverService?: IFaturaRolloverService
}

export function useFaturaRollover(dependencies: RolloverDependencies = {}) {
  const rolloverService = dependencies.faturaRolloverService || faturaRolloverService

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
