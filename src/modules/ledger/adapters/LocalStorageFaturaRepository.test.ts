import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageFaturaRepository } from './LocalStorageFaturaRepository'
import { Fatura } from '../core/domain/Fatura'

describe('LocalStorageFaturaRepository', () => {
  let repo: LocalStorageFaturaRepository

  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStorageFaturaRepository()
  })

  it('deve salvar e buscar uma fatura por ID', async () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    await repo.salvar(fatura)
    const salvo = await repo.buscarPorId('f1')
    expect(salvo).not.toBeNull()
    expect(salvo!.status).toBe('ABERTA')
  })
})
