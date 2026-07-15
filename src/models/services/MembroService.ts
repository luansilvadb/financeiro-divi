import { Membro } from '../entities/Membro'
import type { MembroRole } from '../entities/Membro'
import type { IMembroRepository } from '../repositories/IMembroRepository'
export class MembroService {
  constructor(
    private repository: IMembroRepository
  ) {}

  async adicionarMembro(nome: string, email?: string, password?: string, rendaCentavos?: number): Promise<Membro> {
    const novo = new Membro({ id: crypto.randomUUID(), nome, ativo: true, role: 'MORADOR', rendaCentavos })
    await this.repository.salvar(novo, { email, password })
    return novo
  }

  async desativarMembro(id: string): Promise<void> {
    await this.mutateMembro(id, { ativo: false })
  }

  async ativarMembro(id: string): Promise<void> {
    await this.mutateMembro(id, { ativo: true })
  }

  async atualizarRoleMembro(id: string, role: MembroRole): Promise<void> {
    await this.mutateMembro(id, { role })
  }

  async atualizarNomeMembro(id: string, nome: string): Promise<void> {
    await this.mutateMembro(id, { nome })
  }

  async atualizarRendaMembro(id: string, rendaCentavos?: number): Promise<void> {
    await this.mutateMembro(id, { rendaCentavos })
  }

  private async mutateMembro(id: string, patch: Partial<Pick<Membro, 'ativo' | 'role' | 'nome' | 'rendaCentavos'>>): Promise<void> {
    await this.repository.atualizar(id, {
      nome: patch.nome,
      ativo: patch.ativo,
      role: patch.role,
      rendaCentavos: patch.rendaCentavos,
    })
  }
}

