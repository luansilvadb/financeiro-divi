import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Dinheiro } from '../../entities/Dinheiro'
import { DivisaoDeGasto } from '../../entities/DivisaoDeGasto'
import { Gasto } from '../../entities/Gasto'
import { HttpGastoRepository } from './HttpGastoRepository'

describe('HttpGastoRepository splitMode', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('carrega gastos antigos sem splitMode como custom', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{
        id: 'g1', faturaId: null, descricao: 'Antigo', valorTotalCentavos: 100,
        compradorId: 'm1', divisoes: [{ membroId: 'm1', valorCentavos: 100 }],
      }],
    }))

    const [gasto] = await new HttpGastoRepository().listarTodos()
    expect(gasto.splitMode).toBe('custom')
  })

  it('serializa o critério de rateio explicitamente para a API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'g1', descricao: 'Mercado', valorTotalCentavos: 100, compradorId: 'm1',
        installments: 1, totalInstallments: 1, method: 'pix', isLoan: false,
        isPrivate: false, isSettlement: false, splitMode: 'INCOME', createdAt: '2026-06-13T10:00:00.000Z',
        divisoes: [{ membroId: 'm1', valorCentavos: 100 }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const gasto = new Gasto({
      id: 'g1', faturaId: null, descricao: 'Mercado', valorTotal: Dinheiro.deCentavos(100),
      compradorId: 'm1', divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(100))],
      splitMode: 'income',
    })

    await new HttpGastoRepository().salvar(gasto)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.splitMode).toBe('INCOME')
  })

  it('carrega o campo createdAt corretamente quando retornado pela API', async () => {
    const createdAtStr = '2026-06-13T10:00:00.000Z'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{
        id: 'g1', faturaId: null, descricao: 'Compra Pix', valorTotalCentavos: 15000,
        compradorId: 'm1', divisoes: [{ membroId: 'm1', valorCentavos: 15000 }],
        createdAt: createdAtStr
      }],
    }))

    const [gasto] = await new HttpGastoRepository().listarTodos()
    expect(gasto.createdAt.toISOString()).toBe(createdAtStr)
  })

  it('serializa o campo createdAt na chamada da API', async () => {
    const date = new Date('2026-06-13T10:00:00.000Z')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'g1', descricao: 'Compra Pix', valorTotalCentavos: 15000, compradorId: 'm1',
        installments: 1, totalInstallments: 1, method: 'pix', isLoan: false,
        isPrivate: false, isSettlement: false, splitMode: 'CUSTOM', createdAt: date.toISOString(),
        divisoes: [{ membroId: 'm1', valorCentavos: 15000 }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const gasto = new Gasto({
      id: 'g1', faturaId: null, descricao: 'Compra Pix', valorTotal: Dinheiro.deCentavos(15000),
      compradorId: 'm1', divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(15000))],
      createdAt: date
    })

    await new HttpGastoRepository().salvar(gasto)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.createdAt).toBe(date.toISOString())
  })
})
