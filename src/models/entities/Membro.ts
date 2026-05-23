function capitalizarNome(nome: string): string {
  const preposicoes = ['de', 'do', 'da', 'dos', 'das', 'e']
  return nome
    .trim()
    .split(/\s+/)
    .map((palavra, index) => {
      if (!palavra) return ''
      const minuscula = palavra.toLowerCase()
      if (preposicoes.includes(minuscula) && index > 0) {
        return minuscula
      }
      return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()
    })
    .join(' ')
}

export class Membro {
  readonly id: string
  readonly nome: string
  readonly ativo: boolean
  readonly dataCriacao: Date

  constructor(props: { id: string; nome: string; ativo?: boolean; dataCriacao?: Date }) {
    this.id = props.id
    this.nome = capitalizarNome(props.nome)
    this.ativo = props.ativo ?? true
    this.dataCriacao = props.dataCriacao ?? new Date()
  }
}
