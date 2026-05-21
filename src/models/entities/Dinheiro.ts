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

  maiorQue(outro: Dinheiro): boolean {
    return this.centavos > outro.centavos
  }

  menorQue(outro: Dinheiro): boolean {
    return this.centavos < outro.centavos
  }

  isZero(): boolean {
    return this.centavos === 0
  }

  isPositivo(): boolean {
    return this.centavos > 0
  }

  isNegativo(): boolean {
    return this.centavos < 0
  }

  multiplicar(fator: number): Dinheiro {
    return new Dinheiro(Math.round(this.centavos * fator))
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

  distribuirPorPesos(pesos: number[]): Dinheiro[] {
    const totalPesos = pesos.reduce((acc, p) => acc + p, 0)
    let centavosRestantes = this.centavos

    const valores = pesos.map(p => {
      const valor = Math.trunc(this.centavos * p / totalPesos)
      centavosRestantes -= valor
      return valor
    })

    // Distribuir o resto (centavos órfãos) pelos primeiros pesos
    for (let i = 0; i < Math.abs(centavosRestantes); i++) {
      if (centavosRestantes > 0) {
        valores[i]++
      } else {
        valores[i]--
      }
    }

    return valores.map(c => new Dinheiro(c))
  }
}
