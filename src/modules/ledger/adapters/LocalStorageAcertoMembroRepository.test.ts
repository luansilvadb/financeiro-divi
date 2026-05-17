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

  it('deve salvar, buscar por ID e buscar por fatura', async () => {
    const acerto = new AcertoMembro({
      id: 'a1',
      faturaId: 'f1',
      membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(100),
      totalAntecipado: Dinheiro.deCentavos(50)
    })
    await repo.salvar(acerto)
    const salvo = await repo.buscarPorId('a1')
    expect(salvo).not.toBeNull()
    expect(salvo!.valorAcerto.centavos).toBe(50)
    
    const porFatura = await repo.buscarPorFatura('f1')
    expect(porFatura.length).toBe(1)
  })
})
