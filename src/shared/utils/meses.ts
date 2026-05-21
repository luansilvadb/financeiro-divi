export const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const

export function formatarMesAno(mes: number, ano: number): string {
  return `${NOMES_MESES[mes - 1]} ${ano}`
}

export function gerarListaMesesSeletor(faturasFechadas: any[]) {
  const hoje = new Date()
  const list = []
  for (let i = -12; i <= 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
    const mesIdx = d.getMonth() + 1
    const anoIdx = d.getFullYear()
    const estaFechada = faturasFechadas.some(f => f.periodo.mes === mesIdx && f.periodo.ano === anoIdx)
    list.push({
      mes: mesIdx,
      ano: anoIdx,
      nome: formatarMesAno(mesIdx, anoIdx),
      status: (estaFechada ? 'FECHADA' : 'ABERTA') as 'FECHADA' | 'ABERTA'
    })
  }
  return list
}
