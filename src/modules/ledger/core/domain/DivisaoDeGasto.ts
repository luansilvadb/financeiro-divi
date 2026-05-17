import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

export class DivisaoDeGasto {
  constructor(
    public readonly membroId: string,
    public readonly valor: Dinheiro
  ) {}
}
