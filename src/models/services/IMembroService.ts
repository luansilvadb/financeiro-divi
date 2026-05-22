import type { Membro } from '../entities/Membro'

export interface IMembroService {
  adicionarMembro(nome: string): Promise<Membro>
  desativarMembro(id: string, periodoCorrente?: { mes: number; ano: number }): Promise<void>
  ativarMembro(id: string): Promise<void>
}
