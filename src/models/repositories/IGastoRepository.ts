import { Gasto } from '../entities/Gasto'
import type { IRepository } from './IRepository'

export interface IGastoRepository extends IRepository<Gasto> {
  salvarMuitos(gastos: Gasto[]): Promise<void>
  atualizar(id: string, gasto: Gasto): Promise<void>
  excluir(id: string): Promise<void>
  excluirMuitos(ids: string[]): Promise<void>
}