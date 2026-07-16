interface ContaFixaSplitItem {
  membroId: string
  valorCentavos: number
}

export interface ContaFixa {
  id: string
  name: string
  icon: string
  fixedValueCentavos: number | null
  defaultSplit: ContaFixaSplitItem[]
}
