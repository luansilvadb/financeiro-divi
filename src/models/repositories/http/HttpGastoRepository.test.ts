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
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
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
})
