import { ref } from 'vue'
import { Gasto } from '../core/domain/Gasto'
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
  const isMonthLocked = ref(localStorage.getItem('divi_is_month_locked') === 'true')

  const setMonthLocked = (locked: boolean) => {
    isMonthLocked.value = locked
    localStorage.setItem('divi_is_month_locked', locked ? 'true' : 'false')
  }

  const fRepo = dependencies.faturaRepository || new LocalStorageFaturaRepository()
  const gRepo = dependencies.gastoRepository || new LocalStorageGastoRepository()
  const rolloverService = dependencies.faturaRolloverService || new FaturaRolloverService(fRepo, gRepo)

  const processarRolloverParcelas = (novaFaturaId: string, gastosAnteriores: Gasto[]): Gasto[] => {
    return rolloverService.processarRolloverParcelas(novaFaturaId, gastosAnteriores)
  }

  const gerarTransacoesNettingSaldoInicial = (
    novaFaturaId: string,
    nomePeriodoAnterior: string,
    saldosAnteriores: Record<string, number>
  ): Gasto[] => {
    return rolloverService.gerarTransacoesNettingSaldoInicial(novaFaturaId, nomePeriodoAnterior, saldosAnteriores)
  }

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
    setMonthLocked(false)
  }

  return {
    isMonthLocked,
    setMonthLocked,
    processarRolloverParcelas,
    gerarTransacoesNettingSaldoInicial,
    executarRolloverPeriodo
  }
}
