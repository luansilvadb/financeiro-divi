import { Dinheiro } from './Dinheiro'

export class DivisaoDeGasto {
  constructor(
    public readonly membroId: string,
    public readonly valor: Dinheiro
  ) {}
}
