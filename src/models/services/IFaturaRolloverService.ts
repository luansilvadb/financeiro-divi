import type { Fatura } from '../entities/Fatura'
import type { Gasto } from '../entities/Gasto'

export interface RolloverCartao {
  id: string
  responsavelPadraoId: string
}

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
    cartoes: RolloverCartao[]
    saldosAcumulados: Record<string, number>
    nomePeriodoAnterior: string
  }): Promise<void>
}
