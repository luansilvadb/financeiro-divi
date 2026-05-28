import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageContaFixaRepository } from './LocalStorageContaFixaRepository'
import type { ContaFixa } from '../../entities/ContaFixa'

describe('LocalStorageContaFixaRepository', () => {
  let repo: LocalStorageContaFixaRepository

  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStorageContaFixaRepository()
  })

  it('deve salvar e listar contas fixas', async () => {
    const conta: ContaFixa = {
      id: 'cf1',
      name: 'Internet',
      icon: 'wifi',
      fixedValueCentavos: 1000000,
      defaultSplit: ['m1']
    }
    await repo.salvar(conta)
    const todas = await repo.listarTodas()
    expect(todas).toHaveLength(1)
    expect(todas[0].name).toBe('Internet')
    expect(todas[0].fixedValueCentavos).toBe(1000000)
  })

  it('deve excluir uma conta fixa pelo id', async () => {
    const conta: ContaFixa = {
      id: 'cf2',
      name: 'Água',
      icon: 'water',
      fixedValueCentavos: 500000,
      defaultSplit: ['m1']
    }
    await repo.salvar(conta)
    
    let listadas = await repo.listarTodas()
    expect(listadas.some(c => c.id === 'cf2')).toBe(true)

    await repo.excluir('cf2')
    listadas = await repo.listarTodas()
    expect(listadas.some(c => c.id === 'cf2')).toBe(false)
  })

  it('deve migrar dados antigos do local storage contendo fixedValue', async () => {
    localStorage.setItem('divi_contas_fixas_templates_v18', JSON.stringify([{
      id: 'luz_antiga',
      name: 'Energia',
      icon: '💡',
      fixedValue: 120.50,
      defaultSplit: ['luan']
    }]))

    const list = await repo.listarTodas()
    expect(list[0].fixedValueCentavos).toBe(12050)
  })

  it('deve lançar erro se o banco de dados local estiver corrompido', async () => {
    localStorage.setItem('divi_contas_fixas_templates_v18', '{invalid-json}')
    await expect(repo.listarTodas()).rejects.toThrow('Banco de dados local de contas fixas corrompido')
  })
})
