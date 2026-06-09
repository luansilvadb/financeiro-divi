import { Membro } from '../entities/Membro'
import type { MembroRole } from '../entities/Membro'
import type { IMembroRepository } from '../repositories/IMembroRepository'
export class MembroService {
  constructor(
    private repository: IMembroRepository
  ) {}

  async adicionarMembro(nome: string, username?: string, password?: string): Promise<Membro> {
    const novo = new Membro({ id: crypto.randomUUID(), nome, ativo: true, role: 'MORADOR' })
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
      role: membro.role,
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
      role: membro.role,
      dataCriacao: membro.dataCriacao
    })
    await this.repository.salvar(atualizado)
  }

  async atualizarCargoMembro(id: string, role: MembroRole, cargoId?: string): Promise<void> {
    const membro = await this.repository.buscarPorId(id)
    if (!membro) throw new Error('Membro não encontrado')
    const atualizado = new Membro({
      id: membro.id,
      nome: membro.nome,
      ativo: membro.ativo,
      role: role,
      cargoId: cargoId,
      dataCriacao: membro.dataCriacao,
      userId: membro.userId
    })
    await this.repository.salvar(atualizado)
  }

  async atualizarNomeMembro(id: string, nome: string): Promise<void> {
    const membro = await this.repository.buscarPorId(id)
    if (!membro) throw new Error('Membro não encontrado')
    const atualizado = new Membro({
      id: membro.id,
      nome: nome,
      ativo: membro.ativo,
      role: membro.role,
      cargoId: membro.cargoId,
      dataCriacao: membro.dataCriacao,
      userId: membro.userId
    })
    await this.repository.salvar(atualizado)
  }
}

