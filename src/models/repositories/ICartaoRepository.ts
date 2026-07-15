import { Cartao } from '../entities/Cartao'
import type { IRepository } from './IRepository'

export interface ICartaoRepository extends IRepository<Cartao> {
  excluir(id: string): Promise<void>
}