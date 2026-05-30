import type { Membro } from '../entities/Membro'

export interface IMembroService {
  adicionarMembro(nome: string, username?: string, password?: string): Promise<Membro>
  desativarMembro(id: string): Promise<void>
  ativarMembro(id: string): Promise<void>
}
