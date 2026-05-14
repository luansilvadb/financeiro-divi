export class Dinheiro {
  private constructor(public readonly centavos: number) {}

  static deReais(valor: number): Dinheiro {
    return new Dinheiro(Math.round(valor * 100))
  }

  static deCentavos(centavos: number): Dinheiro {
    return new Dinheiro(centavos)
  }

  formatar(): string {
    return (this.centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).replace(/\s/g, '\u00a0'); // Fix for non-breaking space in some environments
  }

  somar(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.centavos + outro.centavos)
  }

  equals(outro: Dinheiro): boolean {
    return this.centavos === outro.centavos
  }
}
