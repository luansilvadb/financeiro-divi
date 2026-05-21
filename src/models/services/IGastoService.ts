import type { Dinheiro } from '../entities/Dinheiro'
import type { DivisaoDeGasto } from '../entities/DivisaoDeGasto'

export interface LancarGastoInput {
  flow: 'expense' | 'loan'
  paymentMethod: 'pix' | 'card'
  compradorId: string
  valor: number
  descricao: string
  divisoes: any[]
  installments: number
  cardOwnerId: string | null
  borrowerId: string | null
  periodo: { mes: number; ano: number }
}

export interface NettingInput {
  faturaId: string
  descricao: string
  valor: number
  fromMemberId: string
  toMemberId: string
  method: string
}

export interface IGastoService {
  lancarGastoOuEmprestimo(dados: LancarGastoInput): Promise<void>
  excluirGasto(id: string): Promise<void>
  registrarAcertoNetting(dados: NettingInput): Promise<void>
  lancarGastoContaFixa(dados: {
    faturaId: string
    conta: { id: string; name: string }
    valorTotal: number
    compradorId: string
    participantes: string[]
  }): Promise<void>
  atualizarGastoCompleto(
    gastoId: string,
    dados: {
      descricao: string
      valorTotal: Dinheiro
      compradorId: string
      method: 'pix' | 'card'
      cardOwner: string | null
      divisoes: DivisaoDeGasto[]
      installments: number
    }
  ): Promise<void>
}
