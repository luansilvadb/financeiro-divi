import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMembros } from './useMembros'
import { Membro } from '../models/entities/Membro'

vi.mock('../shared/container', () => ({
  membroRepository: {
    listarTodos: vi.fn().mockResolvedValue([]),
    salvar: vi.fn(),
    buscarPorId: vi.fn(),
    obterPermissions: vi.fn().mockResolvedValue({
      MORADOR: {
        ALLOW_LANCAR_GASTO: true,
        ALLOW_GERENCIAR_CARTOES: true,
        ALLOW_GERENCIAR_CONTAS_FIXAS: true,
        ALLOW_REGISTRAR_NETTING: true,
        ALLOW_VER_AUDIT_LOGS: true,
        ALLOW_ALTERAR_RENDA: true,
        ALLOW_ALTERAR_NOME: true
      },
      VISUALIZADOR: {
        ALLOW_LANCAR_GASTO: false,
        ALLOW_GERENCIAR_CARTOES: false,
        ALLOW_GERENCIAR_CONTAS_FIXAS: false,
        ALLOW_REGISTRAR_NETTING: false,
        ALLOW_VER_AUDIT_LOGS: false,
        ALLOW_ALTERAR_RENDA: false,
        ALLOW_ALTERAR_NOME: false
      }
    }),
    atualizarPermissions: vi.fn().mockImplementation(async (role, p) => ({
      MORADOR: {
        ALLOW_LANCAR_GASTO: true,
        ALLOW_GERENCIAR_CARTOES: true,
        ALLOW_GERENCIAR_CONTAS_FIXAS: true,
        ALLOW_REGISTRAR_NETTING: true,
        ALLOW_VER_AUDIT_LOGS: true,
        ALLOW_ALTERAR_RENDA: true,
        ALLOW_ALTERAR_NOME: true
      },
      [role]: p
    }))
  },
  membroService: {
    adicionarMembro: vi.fn(),
    desativarMembro: vi.fn(),
    ativarMembro: vi.fn(),
    atualizarRoleMembro: vi.fn(),
    atualizarNomeMembro: vi.fn(),
    atualizarRendaMembro: vi.fn()
  },
  tenantSessionService: {
    isAuthenticated: () => true,
    getActiveTenantId: () => 't1'
  }
}))

import { membroRepository, membroService } from '../shared/container'

describe('useMembros', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve iniciar vazio se o repositório estiver vazio', async () => {
    const { membros, carregar } = useMembros()
    await carregar()

    expect(membros.value.length).toBe(0)
    expect(membroRepository.listarTodos).toHaveBeenCalled()
  })

  it('deve adicionar um novo membro delegando ao MembroService', async () => {
    let listCounter = 0
    vi.mocked(membroRepository.listarTodos).mockImplementation(async () => {
      listCounter++
      if (listCounter > 1) {
        return [new Membro({ id: 'm1', nome: 'Novo Membro' })]
      }
      return []
    })

    const { membros, adicionarMembro, carregar } = useMembros()
    await carregar()

    await adicionarMembro('Novo Membro')

    expect(membroService.adicionarMembro).toHaveBeenCalledWith('Novo Membro', undefined, undefined, undefined)
    expect(membros.value.length).toBe(1)
    expect(membros.value[0].nome).toBe('Novo Membro')
  })

  it('deve desativar um membro delegando ao MembroService', async () => {
    const membroAtivo = new Membro({ id: 'm-ativo', nome: 'Membro Ativo', ativo: true })
    let listCounter = 0
    vi.mocked(membroRepository.listarTodos).mockImplementation(async () => {
      listCounter++
      if (listCounter > 1) {
        return [new Membro({ id: 'm-ativo', nome: 'Membro Ativo', ativo: false })]
      }
      return [membroAtivo]
    })

    const { ativos, desativarMembro, carregar } = useMembros()
    await carregar()

    expect(ativos.value.length).toBe(1)

    await desativarMembro('m-ativo')

    expect(membroService.desativarMembro).toHaveBeenCalledWith('m-ativo')
    expect(ativos.value.length).toBe(0)
  })

  it('deve atualizar a role de um membro delegando ao MembroService', async () => {
    const membro = new Membro({ id: 'm1', nome: 'Membro', role: 'MORADOR' })
    let listCounter = 0
    vi.mocked(membroRepository.listarTodos).mockImplementation(async () => {
      listCounter++
      if (listCounter > 1) {
        return [new Membro({ id: 'm1', nome: 'Membro', role: 'ADMIN' })]
      }
      return [membro]
    })

    const { membros, atualizarRoleMembro, carregar } = useMembros()
    await carregar()

    await atualizarRoleMembro('m1', 'ADMIN')

    expect(membroService.atualizarRoleMembro).toHaveBeenCalledWith('m1', 'ADMIN')
    expect(membros.value[0].role).toBe('ADMIN')
  })

  it('deve atualizar o nome de um membro delegando ao MembroService', async () => {
    const membro = new Membro({ id: 'm1', nome: 'Membro' })
    let listCounter = 0
    vi.mocked(membroRepository.listarTodos).mockImplementation(async () => {
      listCounter++
      if (listCounter > 1) {
        return [new Membro({ id: 'm1', nome: 'Membro Novo' })]
      }
      return [membro]
    })

    const { membros, atualizarNomeMembro, carregar } = useMembros()
    await carregar()

    await atualizarNomeMembro('m1', 'Membro Novo')

    expect(membroService.atualizarNomeMembro).toHaveBeenCalledWith('m1', 'Membro Novo')
    expect(membros.value[0].nome).toBe('Membro Novo')
  })

  it('deve atualizar a renda de um membro delegando ao MembroService', async () => {
    const miembro = new Membro({ id: 'm1', nome: 'Membro', rendaCentavos: 1000 })
    let listCounter = 0
    vi.mocked(membroRepository.listarTodos).mockImplementation(async () => {
      listCounter++
      if (listCounter > 1) {
        return [new Membro({ id: 'm1', nome: 'Membro', rendaCentavos: 5000 })]
      }
      return [miembro]
    })

    const { membros, atualizarRendaMembro, carregar } = useMembros()
    await carregar()

    await atualizarRendaMembro('m1', 5000)

    expect(membroService.atualizarRendaMembro).toHaveBeenCalledWith('m1', 5000)
    expect(membros.value[0].rendaCentavos).toBe(5000)
  })

  it('deve atualizar as permissões do tenant e salvar no estado', async () => {
    const { tenantPermissions, atualizarPermissions } = useMembros()
    await atualizarPermissions('MORADOR', { ALLOW_LANCAR_GASTO: false })
    expect(membroRepository.atualizarPermissions).toHaveBeenCalledWith('MORADOR', { ALLOW_LANCAR_GASTO: false })
    expect(tenantPermissions.value.MORADOR.ALLOW_LANCAR_GASTO).toBe(false)
  })
})
