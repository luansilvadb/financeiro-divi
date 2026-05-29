import { Membro } from '../entities/Membro'

export interface IMembroRepository {
  salvar(membro: Membro, credentials?: { username?: string; password?: string }): Promise<void>
  listarTodos(): Promise<Membro[]>
  buscarPorId(id: string): Promise<Membro | null>
}
