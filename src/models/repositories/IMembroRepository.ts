import { Membro } from '../entities/Membro'

export interface IMembroRepository {
  salvar(membro: Membro, credentials?: { email?: string; password?: string }): Promise<void>
  listarTodos(): Promise<Membro[]>
  buscarPorId(id: string): Promise<Membro | null>
}
