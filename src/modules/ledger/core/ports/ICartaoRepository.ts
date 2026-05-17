import { Cartao } from '../domain/Cartao'

export interface ICartaoRepository {
  buscarPorId(id: string): Promise<Cartao | null>
  salvar(cartao: Cartao): Promise<void>
}