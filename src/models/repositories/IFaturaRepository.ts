import { Fatura } from '../entities/Fatura'
import type { FaturaPeriodo } from '../entities/Fatura'

export interface IFaturaRepository {
  buscarPorId(id: string): Promise<Fatura | null>
  buscarPorCartaoEPeriodo(cartaoId: string, periodo: FaturaPeriodo): Promise<Fatura | null>
  salvar(fatura: Fatura): Promise<void>
  listarTodas(): Promise<Fatura[]>
}