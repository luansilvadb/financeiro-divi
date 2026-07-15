import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpCartaoRepository } from './HttpCartaoRepository'

function mockFetch(json: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({ ok, status, json: async () => json })
}

function cartaoPayload(overrides = {}) {
  return {
    id: 'c1',
    nome: 'Nubank',
    diaFechamento: 15,
    responsavelPadraoId: 'm1',
    ...overrides,
  }
}

describe('HttpCartaoRepository', () => {
  let repo: HttpCartaoRepository

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.setItem('divi_jwt_token', 'test-token')
    localStorage.setItem('divi_active_tenant_id', 'tenant-1')
    repo = new HttpCartaoRepository()
  })

  describe('listarTodos', () => {
    it('retorna array de cartões mapeados', async () => {
      vi.stubGlobal('fetch', mockFetch([cartaoPayload()]))

      const cartoes = await repo.listarTodos()

      expect(cartoes).toHaveLength(1)
      expect(cartoes[0].id).toBe('c1')
      expect(cartoes[0].nome).toBe('Nubank')
      expect(cartoes[0].diaFechamento).toBe(15)
      expect(cartoes[0].responsavelPadraoId).toBe('m1')
    })

    it('retorna array vazio para lista vazia', async () => {
      vi.stubGlobal('fetch', mockFetch([]))

      const cartoes = await repo.listarTodos()

      expect(cartoes).toEqual([])
    })

    it('suporta resposta paginada', async () => {
      vi.stubGlobal('fetch', mockFetch({
        data: [cartaoPayload()],
        total: 1,
        page: 1,
        page_size: 20,
        totalPages: 1,
      }))

      const cartoes = await repo.listarTodos()

      expect(cartoes).toHaveLength(1)
      expect(cartoes[0].nome).toBe('Nubank')
    })
  })

  describe('buscarPorId', () => {
    it('retorna cartão pelo id', async () => {
      vi.stubGlobal('fetch', mockFetch([
        cartaoPayload({ id: 'c1', nome: 'Nubank' }),
        cartaoPayload({ id: 'c2', nome: 'Inter' }),
      ]))

      const cartao = await repo.buscarPorId('c2')

      expect(cartao?.nome).toBe('Inter')
    })

    it('retorna null se não encontrar', async () => {
      vi.stubGlobal('fetch', mockFetch([cartaoPayload()]))

      const cartao = await repo.buscarPorId('inexistente')

      expect(cartao).toBeNull()
    })
  })

  describe('salvar', () => {
    it('envia POST para /cartoes com dados corretos e valida resposta', async () => {
      const fetchMockFn = mockFetch(cartaoPayload(), true, 201)
      vi.stubGlobal('fetch', fetchMockFn)

      const cartao = { nome: 'Inter', diaFechamento: 10, responsavelPadraoId: 'm2' } as any
      await repo.salvar(cartao)

      const [url, init] = fetchMockFn.mock.calls[0]
      expect(url).toContain('/cartoes')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body)
      expect(body.nome).toBe('Inter')
      expect(body.diaFechamento).toBe(10)
      expect(body.responsavelPadraoId).toBe('m2')
    })

    it('valida request body antes de enviar — rejeita diaFechamento inválido', async () => {
      const cartao = { nome: 'Inválido', diaFechamento: 32, responsavelPadraoId: 'm1' } as any
      await expect(repo.salvar(cartao)).rejects.toThrow()
    })
  })

  describe('excluir', () => {
    it('envia DELETE para /cartoes/:id', async () => {
      const fetchMockFn = mockFetch(null, true, 204)
      vi.stubGlobal('fetch', fetchMockFn)

      await repo.excluir('c1')

      const [url, init] = fetchMockFn.mock.calls[0]
      expect(url).toContain('/cartoes/c1')
      expect(init.method).toBe('DELETE')
    })
  })
})
