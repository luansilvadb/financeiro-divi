import { Cartao } from '../entities/Cartao'

export interface ICartaoRepository {
  buscarPorId(id: string): Promise<Cartao | null>
  salvar(cartao: Cartao): Promise<void>
  listarTodos(): Promise<Cartao[]>
  excluir(id: string): Promise<void>
}