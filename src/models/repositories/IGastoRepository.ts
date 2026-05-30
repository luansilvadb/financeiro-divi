import { Gasto } from '../entities/Gasto'

export interface IGastoRepository {
  buscarPorId(id: string): Promise<Gasto | null>
  salvar(gasto: Gasto): Promise<void>
  salvarMuitos(gastos: Gasto[]): Promise<void>
  excluir(id: string): Promise<void>
  excluirMuitos(ids: string[]): Promise<void>
  listarTodos(): Promise<Gasto[]>
}