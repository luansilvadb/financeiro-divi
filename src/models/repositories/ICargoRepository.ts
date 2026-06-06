import { Cargo } from '../entities/Cargo'

export interface ICargoRepository {
  listarTodos(): Promise<Cargo[]>
  salvar(cargo: Cargo): Promise<Cargo>
  excluir(id: string): Promise<void>
}
