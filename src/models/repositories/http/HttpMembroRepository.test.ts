import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpMembroRepository } from './HttpMembroRepository'

function mockFetch(json: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({ ok, status, json: async () => json })
}

function membroPayload(overrides = {}) {
  return {
    id: 'm1',
    nome: 'João',
    avatar: 'blob-1',
    ativo: true,
    role: 'ADMIN' as const,
    rendaCentavos: 500000,
    userId: 'u1',
    createdAt: '2025-01-15T10:30:00Z',
    ...overrides,
  }
}

describe('HttpMembroRepository', () => {
  let repo: HttpMembroRepository

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.setItem('divi_jwt_token', 'test-token')
    localStorage.setItem('divi_active_tenant_id', 'tenant-1')
    repo = new HttpMembroRepository()
  })

  describe('listarTodos', () => {
    it('retorna array de membros mapeados para o domínio', async () => {
      vi.stubGlobal('fetch', mockFetch([membroPayload()]))

      const membros = await repo.listarTodos()

      expect(membros).toHaveLength(1)
      expect(membros[0].id).toBe('m1')
      expect(membros[0].nome).toBe('João')
      expect(membros[0].avatar).toBe('blob-1')
      expect(membros[0].ativo).toBe(true)
      expect(membros[0].role).toBe('ADMIN')
      expect(membros[0].rendaCentavos).toBe(500000)
    })

    it('retorna array vazio para lista vazia', async () => {
      vi.stubGlobal('fetch', mockFetch([]))

      const membros = await repo.listarTodos()

      expect(membros).toEqual([])
    })

    it('suporta resposta paginada', async () => {
      vi.stubGlobal('fetch', mockFetch({
        data: [membroPayload()],
        total: 1,
        page: 1,
        page_size: 20,
        totalPages: 1,
      }))

      const membros = await repo.listarTodos()

      expect(membros).toHaveLength(1)
      expect(membros[0].id).toBe('m1')
    })

    it('trata membro inativo com ativo: false (default)', async () => {
      vi.stubGlobal('fetch', mockFetch([membroPayload({ ativo: undefined })]))

      const membros = await repo.listarTodos()

      expect(membros[0].ativo).toBe(true) // default quando undefined
    })

    it('trata membro sem role — entidade usa default MORADOR', async () => {
      vi.stubGlobal('fetch', mockFetch([membroPayload({ role: undefined })]))

      const membros = await repo.listarTodos()

      expect(membros[0].role).toBe('MORADOR') // default da entidade Membro
    })
  })

  describe('buscarPorId', () => {
    it('retorna membro pelo id', async () => {
      vi.stubGlobal('fetch', mockFetch([
        membroPayload({ id: 'm1', nome: 'João' }),
        membroPayload({ id: 'm2', nome: 'Maria' }),
      ]))

      const membro = await repo.buscarPorId('m2')

      expect(membro?.nome).toBe('Maria')
    })

    it('retorna null se não encontrar', async () => {
      vi.stubGlobal('fetch', mockFetch([membroPayload()]))

      const membro = await repo.buscarPorId('inexistente')

      expect(membro).toBeNull()
    })
  })

  describe('salvar', () => {
    it('envia POST para /membros com dados corretos (sem conta)', async () => {
      const fetchMockFn = mockFetch(membroPayload(), true, 201)
      vi.stubGlobal('fetch', fetchMockFn)

      const membro = { nome: 'Novo', avatar: 'blob-n' } as any
      await repo.salvar(membro)

      const [url, init] = fetchMockFn.mock.calls[0]
      expect(url).toContain('/membros')
      const body = JSON.parse(init.body)
      expect(body.nome).toBe('Novo')
      expect(body.avatar).toBe('blob-n')
      expect(init.method).toBe('POST')
    })

    it('envia POST para /membros/with-account quando credentials fornecidas', async () => {
      const fetchMockFn = mockFetch(membroPayload(), true, 201)
      vi.stubGlobal('fetch', fetchMockFn)

      const membro = { nome: 'Novo', avatar: 'blob-n' } as any
      await repo.salvar(membro, { email: 'novo@teste.com', password: 'Abcdef123' })

      const [url] = fetchMockFn.mock.calls[0]
      expect(url).toContain('/membros/with-account')
    })
  })

  describe('atualizar', () => {
    it('envia PUT para /membros/:id com patch', async () => {
      const fetchMockFn = mockFetch(membroPayload())
      vi.stubGlobal('fetch', fetchMockFn)

      await repo.atualizar('m1', { nome: 'Nome Atualizado' })

      const [url, init] = fetchMockFn.mock.calls[0]
      expect(url).toContain('/membros/m1')
      expect(init.method).toBe('PUT')
      const body = JSON.parse(init.body)
      expect(body.nome).toBe('Nome Atualizado')
    })

    it('envia múltiplos campos no patch', async () => {
      const fetchMockFn = mockFetch(membroPayload())
      vi.stubGlobal('fetch', fetchMockFn)

      await repo.atualizar('m1', { nome: 'Novo Nome', ativo: false, rendaCentavos: null })

      const body = JSON.parse(fetchMockFn.mock.calls[0][1].body)
      expect(body.nome).toBe('Novo Nome')
      expect(body.ativo).toBe(false)
      expect(body.rendaCentavos).toBeNull()
    })
  })

  describe('obterPermissions', () => {
    it('retorna permissões por role', async () => {
      vi.stubGlobal('fetch', mockFetch({
        ADMIN: { ALLOW_LANCAR_GASTO: true, ALLOW_GERENCIAR_CARTOES: true },
        MORADOR: { ALLOW_LANCAR_GASTO: true },
      }))

      const perms = await repo.obterPermissions()

      expect(perms.ADMIN.ALLOW_LANCAR_GASTO).toBe(true)
      expect(perms.MORADOR.ALLOW_LANCAR_GASTO).toBe(true)
    })
  })

  describe('atualizarPermissions', () => {
    it('envia PATCH para /tenants/permissions/:role', async () => {
      const fetchMockFn = mockFetch({
        ADMIN: { ALLOW_LANCAR_GASTO: true },
        MORADOR: { ALLOW_LANCAR_GASTO: false },
      })
      vi.stubGlobal('fetch', fetchMockFn)

      const result = await repo.atualizarPermissions('MORADOR', { ALLOW_LANCAR_GASTO: false })

      const [url, init] = fetchMockFn.mock.calls[0]
      expect(url).toContain('/tenants/permissions/MORADOR')
      expect(init.method).toBe('PATCH')
      const body = JSON.parse(init.body)
      expect(body.ALLOW_LANCAR_GASTO).toBe(false)
      expect(result.MORADOR.ALLOW_LANCAR_GASTO).toBe(false)
    })
  })
})
