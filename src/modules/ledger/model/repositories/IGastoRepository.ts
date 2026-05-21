import { Gasto } from '../domain/Gasto'

export interface IGastoRepository {
  buscarPorFatura(faturaId: string): Promise<Gasto[]>
  salvar(gasto: Gasto): Promise<void>
  excluir(id: string): Promise<void>
}