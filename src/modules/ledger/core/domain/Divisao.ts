import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

export class Divisao {
  constructor(
    public readonly beneficiario_id: string,
    public readonly valor: Dinheiro
  ) {}
}
