import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageAcertoMembroRepository } from './LocalStorageAcertoMembroRepository'
import { AcertoMembro } from '../core/domain/AcertoMembro'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'

describe('LocalStorageAcertoMembroRepository', () => {
  let repo: LocalStorageAcertoMembroRepository

  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStorageAcertoMembroRepository()
  })

  it('deve salvar, buscar por ID e buscar por fatura gravando valorPagoCentavos', async () => {
    const acerto = new AcertoMembro({
      id: 'a1',
      faturaId: 'f1',
      membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(10000),
      totalAntecipado: Dinheiro.deCentavos(2000),
      valorPago: Dinheiro.deCentavos(3000)
    })
    await repo.salvar(acerto)
    const salvo = await repo.buscarPorId('a1')
    expect(salvo).not.toBeNull()
    expect(salvo!.valorAcerto.centavos).toBe(8000)
    expect(salvo!.valorPago.centavos).toBe(3000)
    expect(salvo!.pago).toBe(false)
    
    const porFatura = await repo.buscarPorFatura('f1')
    expect(porFatura.length).toBe(1)
  })

  it('deve inferir valorPagoCentavos a partir do pago legado se nao houver campo', async () => {
    const legado = [{
      id: 'ac_legacy',
      faturaId: 'f1',
      membroId: 'm1',
      totalConsumidoCentavos: 10000,
      totalAntecipadoCentavos: 2000,
      pago: true
    }]
    localStorage.setItem('divi_acertos_membro', JSON.stringify(legado))

    const recovered = await repo.buscarPorId('ac_legacy')
    expect(recovered).not.toBeNull()
    expect(recovered!.valorPago.centavos).toBe(8000) // valorAcerto total
    expect(recovered!.pago).toBe(true)
  })
})
