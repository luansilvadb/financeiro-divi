import { Membro } from '../entities/Membro'

export interface IMembroRepository {
  salvar(membro: Membro): Promise<void>
  listarTodos(): Promise<Membro[]>
  buscarPorId(id: string): Promise<Membro | null>
}
