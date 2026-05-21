import type { Fatura } from '../entities/Fatura'
import type { Gasto } from '../entities/Gasto'

export interface IFaturaRolloverService {
  processarRolloverParcelas(novaFaturaId: string, gastosAnteriores: Gasto[]): Gasto[]
  gerarTransacoesNettingSaldoInicial(
    novaFaturaId: string,
    nomePeriodoAnterior: string,
    saldosAnteriores: Record<string, number>
  ): Gasto[]
  executarRolloverPeriodo(dados: {
    nomeNovoPeriodo: string
    faturasAbertas: Fatura[]
    cartoes: any[]
    saldosAcumulados: Record<string, number>
    nomePeriodoAnterior: string
  }): Promise<void>
}
