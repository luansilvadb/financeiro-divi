import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpContaFixaRepository } from './HttpContaFixaRepository'

function mockFetch(json: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({ ok, status, json: async () => json })
}

function contaFixaPayload(overrides = {}) {
  return {
    id: 'cf1',
    name: 'Aluguel',
    icon: 'home',
    fixedValueCentavos: 200000,
    defaultSplit: [
      { membroId: 'm1', valorCentavos: 100000 },
      { membroId: 'm2', valorCentavos: 100000 },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('HttpContaFixaRepository', () => {
  let repo: HttpContaFixaRepository

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.setItem('divi_jwt_token', 'test-token')
    localStorage.setItem('divi_active_tenant_id', 'tenant-1')
    repo = new HttpContaFixaRepository()
  })

  describe('listarTodas', () => {
    it('retorna array de contas fixas mapeadas', async () => {
      vi.stubGlobal('fetch', mockFetch([contaFixaPayload()]))

      const contas = await repo.listarTodas()

      expect(contas).toHaveLength(1)
      expect(contas[0].id).toBe('cf1')
      expect(contas[0].name).toBe('Aluguel')
      expect(contas[0].icon).toBe('home')
      expect(contas[0].fixedValueCentavos).toBe(200000)
      expect(contas[0].defaultSplit).toHaveLength(2)
      expect(contas[0].defaultSplit[0].membroId).toBe('m1')
      expect(contas[0].defaultSplit[0].valorCentavos).toBe(100000)
    })

    it('trata conta com valor fixo nulo', async () => {
      vi.stubGlobal('fetch', mockFetch([contaFixaPayload({ fixedValueCentavos: null })]))

      const contas = await repo.listarTodas()

      expect(contas[0].fixedValueCentavos).toBeNull()
    })

    it('trata defaultSplit vazio (array vazio do backend)', async () => {
      vi.stubGlobal('fetch', mockFetch([contaFixaPayload({ defaultSplit: [] })]))

      const contas = await repo.listarTodas()

      expect(contas[0].defaultSplit).toEqual([])
    })

    it('suporta resposta paginada', async () => {
      vi.stubGlobal('fetch', mockFetch({
        data: [contaFixaPayload()],
        total: 1, page: 1, page_size: 20, totalPages: 1,
      }))

      const contas = await repo.listarTodas()

      expect(contas).toHaveLength(1)
    })

    it('retorna array vazio para lista vazia', async () => {
      vi.stubGlobal('fetch', mockFetch([]))

      const contas = await repo.listarTodas()

      expect(contas).toEqual([])
    })

    it('aceita createdAt no payload (campo adicionado ao schema)', async () => {
      vi.stubGlobal('fetch', mockFetch([contaFixaPayload({ createdAt: '2025-06-01T10:00:00Z' })]))

      const contas = await repo.listarTodas()

      expect(contas).toHaveLength(1)
    })
  })

  describe('salvar', () => {
    it('envia POST para /contas-fixas com dados corretos e valida resposta', async () => {
      const fetchMockFn = mockFetch(contaFixaPayload(), true, 201)
      vi.stubGlobal('fetch', fetchMockFn)

      const conta = {
        name: 'Internet',
        icon: 'wifi',
        fixedValueCentavos: 10000,
        defaultSplit: [{ membroId: 'm1', valorCentavos: 10000 }],
      } as any
      await repo.salvar(conta)

      const [url, init] = fetchMockFn.mock.calls[0]
      expect(url).toContain('/contas-fixas')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body)
      expect(body.name).toBe('Internet')
      expect(body.icon).toBe('wifi')
      expect(body.fixedValueCentavos).toBe(10000)
      expect(body.defaultSplit).toHaveLength(1)
    })

    it('valida request body — rejeita name vazio', async () => {
      const conta = { name: '', icon: 'home', fixedValueCentavos: null, defaultSplit: [] } as any
      await expect(repo.salvar(conta)).rejects.toThrow()
    })

    it('valida resposta — lança se backend retornar formato inválido', async () => {
      vi.stubGlobal('fetch', mockFetch({ invalid: true }, true, 201))

      const conta = {
        name: 'Internet', icon: 'wifi', fixedValueCentavos: null, defaultSplit: [],
      } as any
      await expect(repo.salvar(conta)).rejects.toThrow('[API Contract]')
    })

    it('permite fixedValueCentavos null (conta variável)', async () => {
      const fetchMockFn = mockFetch(contaFixaPayload({ fixedValueCentavos: null }), true, 201)
      vi.stubGlobal('fetch', fetchMockFn)

      const conta = {
        name: 'Conta Variável', icon: 'zap', fixedValueCentavos: null, defaultSplit: [],
      } as any
      await repo.salvar(conta)

      const body = JSON.parse(fetchMockFn.mock.calls[0][1].body)
      expect(body.fixedValueCentavos).toBeNull()
    })
  })

  describe('excluir', () => {
    it('envia DELETE para /contas-fixas/:id', async () => {
      const fetchMockFn = mockFetch(null, true, 204)
      vi.stubGlobal('fetch', fetchMockFn)

      await repo.excluir('cf1')

      const [url, init] = fetchMockFn.mock.calls[0]
      expect(url).toContain('/contas-fixas/cf1')
      expect(init.method).toBe('DELETE')
    })
  })
})
