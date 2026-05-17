import { describe, it, expect } from 'vitest'
import { Membro } from './Membro'

describe('Membro', () => {
  it('deve criar um membro ativo por padrão', () => {
    const membro = new Membro({ id: '1', nome: 'Luan' })
    expect(membro.nome).toBe('Luan')
    expect(membro.ativo).toBe(true)
  })
})
