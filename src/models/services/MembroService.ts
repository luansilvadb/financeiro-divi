import { Membro } from '../entities/Membro'
import type { IMembroRepository } from '../repositories/IMembroRepository'
import type { IMembroService } from './IMembroService'

export class MembroService implements IMembroService {
  constructor(
    private repository: IMembroRepository
  ) {}

  async adicionarMembro(nome: string, username?: string, password?: string): Promise<Membro> {
    const novo = new Membro({ id: crypto.randomUUID(), nome, ativo: true })
    await this.repository.salvar(novo, { username, password })
    return novo
  }

  async desativarMembro(id: string): Promise<void> {
    const membro = await this.repository.buscarPorId(id)
    if (!membro) throw new Error('Membro não encontrado')

    const atualizado = new Membro({
      id: membro.id,
      nome: membro.nome,
      ativo: false,
      dataCriacao: membro.dataCriacao
    })
    await this.repository.salvar(atualizado)
  }

  async ativarMembro(id: string): Promise<void> {
    const membro = await this.repository.buscarPorId(id)
    if (!membro) throw new Error('Membro não encontrado')
    const atualizado = new Membro({
      id: membro.id,
      nome: membro.nome,
      ativo: true,
      dataCriacao: membro.dataCriacao
    })
    await this.repository.salvar(atualizado)
  }
}
