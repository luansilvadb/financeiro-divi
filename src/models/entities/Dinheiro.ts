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

  subtrair(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.centavos - outro.centavos)
  }

  equals(outro: Dinheiro): boolean {
    return this.centavos === outro.centavos
  }

  isPositivo(): boolean {
    return this.centavos > 0
  }

  distribuir(n: number): Dinheiro[] {
    if (n <= 0) throw new Error("Número de partes deve ser maior que zero")
    if (n === 1) return [new Dinheiro(this.centavos)]

    const quociente = Math.trunc(this.centavos / n)
    let resto = this.centavos % n

    const resultados: Dinheiro[] = []
    for (let i = 0; i < n; i++) {
      const adicional = resto > 0 ? 1 : (resto < 0 ? -1 : 0)
      resultados.push(new Dinheiro(quociente + adicional))
      if (resto > 0) resto--
      else if (resto < 0) resto++
    }
    return resultados
  }
}
