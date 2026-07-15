import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpFaturaRepository } from './HttpFaturaRepository'

function mockFetch(json: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({ ok, status, json: async () => json })
}

function faturaPayload(overrides = {}) {
  return {
    id: 'f1',
    cartaoId: 'c1',
    mes: 6,
    ano: 2026,
    responsavelId: 'm1',
    status: 'ABERTA' as const,
    dataPagamentoBanco: null as string | null,
    ...overrides,
  }
}

describe('HttpFaturaRepository', () => {
  let repo: HttpFaturaRepository

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.setItem('divi_jwt_token', 'test-token')
    localStorage.setItem('divi_active_tenant_id', 'tenant-1')
    repo = new HttpFaturaRepository()
  })

  describe('listarTodas', () => {
    it('retorna array de faturas mapeadas para o domínio', async () => {
      vi.stubGlobal('fetch', mockFetch([faturaPayload()]))

      const faturas = await repo.listarTodas()

      expect(faturas).toHaveLength(1)
      expect(faturas[0].id).toBe('f1')
      expect(faturas[0].cartaoId).toBe('c1')
      expect(faturas[0].periodo.mes).toBe(6)
      expect(faturas[0].periodo.ano).toBe(2026)
      expect(faturas[0].responsavelId).toBe('m1')
      expect(faturas[0].status).toBe('ABERTA')
      expect(faturas[0].dataPagamentoBanco).toBeUndefined()
    })

    it('converte dataPagamentoBanco para Date', async () => {
      vi.stubGlobal('fetch', mockFetch([faturaPayload({
        status: 'FECHADA',
        dataPagamentoBanco: '2025-06-20T00:00:00Z',
      })]))

      const faturas = await repo.listarTodas()

      expect(faturas[0].dataPagamentoBanco).toBeInstanceOf(Date)
      expect(faturas[0].dataPagamentoBanco!.toISOString()).toBe('2025-06-20T00:00:00.000Z')
    })

    it('suporta resposta paginada', async () => {
      vi.stubGlobal('fetch', mockFetch({
        data: [faturaPayload()],
        total: 1, page: 1, page_size: 20, totalPages: 1,
      }))

      const faturas = await repo.listarTodas()

      expect(faturas).toHaveLength(1)
    })

    it('retorna array vazio para lista vazia', async () => {
      vi.stubGlobal('fetch', mockFetch([]))

      const faturas = await repo.listarTodas()

      expect(faturas).toEqual([])
    })
  })

  describe('buscarPorId', () => {
    it('retorna fatura pelo id', async () => {
      vi.stubGlobal('fetch', mockFetch([
        faturaPayload({ id: 'f1', mes: 6 }),
        faturaPayload({ id: 'f2', mes: 7 }),
      ]))

      const fatura = await repo.buscarPorId('f2')

      expect(fatura?.periodo.mes).toBe(7)
    })

    it('retorna null se não encontrar', async () => {
      vi.stubGlobal('fetch', mockFetch([faturaPayload()]))

      const fatura = await repo.buscarPorId('inexistente')

      expect(fatura).toBeNull()
    })
  })

  describe('buscarPorCartaoEPeriodo', () => {
    it('retorna fatura por cartão e período', async () => {
      vi.stubGlobal('fetch', mockFetch([
        faturaPayload({ id: 'f1', cartaoId: 'c1', mes: 6, ano: 2026 }),
        faturaPayload({ id: 'f2', cartaoId: 'c2', mes: 6, ano: 2026 }),
      ]))

      const fatura = await repo.buscarPorCartaoEPeriodo('c1', { mes: 6, ano: 2026 })

      expect(fatura?.id).toBe('f1')
    })

    it('retorna null se não encontrar para o período', async () => {
      vi.stubGlobal('fetch', mockFetch([faturaPayload()]))

      const fatura = await repo.buscarPorCartaoEPeriodo('c1', { mes: 12, ano: 2026 })

      expect(fatura).toBeNull()
    })
  })

  describe('salvar', () => {
    it('envia POST para /faturas com dados corretos e valida resposta', async () => {
      const fetchMockFn = mockFetch(faturaPayload(), true, 201)
      vi.stubGlobal('fetch', fetchMockFn)

      const fatura = {
        cartaoId: 'c1',
        periodo: { mes: 7, ano: 2026 },
        responsavelId: 'm1',
        status: 'ABERTA',
      } as any
      await repo.salvar(fatura)

      const [url, init] = fetchMockFn.mock.calls[0]
      expect(url).toContain('/faturas')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body)
      expect(body.mes).toBe(7)
      expect(body.ano).toBe(2026)
      expect(body.status).toBe('ABERTA')
    })

    it('valida request body — rejeita mês > 12', async () => {
      const fatura = {
        cartaoId: 'c1',
        periodo: { mes: 13, ano: 2026 },
        responsavelId: 'm1',
        status: 'ABERTA',
      } as any
      await expect(repo.salvar(fatura)).rejects.toThrow()
    })

    it('valida resposta — lança se backend retornar formato inválido', async () => {
      vi.stubGlobal('fetch', mockFetch({ invalid: 'response' }, true, 201))

      const fatura = {
        cartaoId: 'c1',
        periodo: { mes: 7, ano: 2026 },
        responsavelId: 'm1',
        status: 'ABERTA',
      } as any
      await expect(repo.salvar(fatura)).rejects.toThrow('[API Contract]')
    })

    it('converte dataPagamentoBanco de Date para string ISO ao salvar fatura fechada', async () => {
      const fetchMockFn = mockFetch(faturaPayload({ status: 'FECHADA' }), true, 201)
      vi.stubGlobal('fetch', fetchMockFn)

      const fatura = {
        cartaoId: 'c1',
        periodo: { mes: 7, ano: 2026 },
        responsavelId: 'm1',
        status: 'FECHADA' as const,
        dataPagamentoBanco: new Date('2026-07-14T15:23:54.093Z'),
      } as any
      await repo.salvar(fatura)

      const body = JSON.parse(fetchMockFn.mock.calls[0][1].body)
      expect(body.dataPagamentoBanco).toBe('2026-07-14T15:23:54.093Z')
      expect(typeof body.dataPagamentoBanco).toBe('string')
    })
  })

  describe('salvarMuitas', () => {
    it('envia POST para /faturas/batch com array de faturas', async () => {
      const fetchMockFn = mockFetch({ message: 'faturas registradas' }, true, 201)
      vi.stubGlobal('fetch', fetchMockFn)

      const faturas = [
        { cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' },
        { cartaoId: 'c2', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm2', status: 'ABERTA' },
      ] as any[]
      await repo.salvarMuitas(faturas)

      const [url, init] = fetchMockFn.mock.calls[0]
      expect(url).toContain('/faturas/batch')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body)
      expect(body).toHaveLength(2)
      expect(body[0].cartaoId).toBe('c1')
      expect(body[1].cartaoId).toBe('c2')
    })
  })

  describe('assegurarObterOuCriarFatura', () => {
    it('retorna fatura existente se já existir', async () => {
      vi.stubGlobal('fetch', mockFetch([faturaPayload({ cartaoId: 'c1', mes: 6, ano: 2026 })]))

      const fatura = await repo.assegurarObterOuCriarFatura('c1', 6, 2026, 'm1')

      expect(fatura.id).toBe('f1')
    })

    it('cria nova fatura se não existir', async () => {
      const fetchMockFn = vi.fn()
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] }) // listarTodas
        .mockResolvedValueOnce({ ok: true, status: 201, json: async () => faturaPayload({ cartaoId: 'c1', mes: 6, ano: 2026 }) }) // salvar
      vi.stubGlobal('fetch', fetchMockFn)

      const fatura = await repo.assegurarObterOuCriarFatura('c1', 6, 2026, 'm1')

      expect(fatura.cartaoId).toBe('c1')
      expect(fetchMockFn).toHaveBeenCalledTimes(2) // listar + salvar
    })
  })
})
