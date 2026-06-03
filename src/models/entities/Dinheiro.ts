export class Dinheiro {
  private constructor(public readonly centavos: number) {}

  static deReais(valor: number): Dinheiro {
    return new Dinheiro(Math.round(valor * 100))
  }

  static deCentavos(centavos: number): Dinheiro {
    return new Dinheiro(centavos)
  }

  somar(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.centavos + outro.centavos)
  }

  subtrair(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.centavos - outro.centavos)
  }

  distribuir(n: number): Dinheiro[] {
    const resultados: Dinheiro[] = []
    for (let i = 0; i < n; i++) {
      resultados.push(this.valorNoIndice(n, i))
    }
    return resultados
  }

  /**
   * Retorna o valor de uma parte específica se este valor fosse distribuído em n partes.
   * O(1) tempo e O(1) espaço.
   */
  valorNoIndice(n: number, index: number): Dinheiro {
    if (n <= 0) return Dinheiro.deCentavos(0)
    if (index < 0 || index >= n) return Dinheiro.deCentavos(0)
    if (n === 1) return new Dinheiro(this.centavos)

    const quociente = Math.trunc(this.centavos / n)
    const resto = this.centavos % n

    // Lógica de distribuição do distribuir(n):
    // Se resto > 0, as primeiras 'resto' partes recebem quociente + 1
    // Se resto < 0, as primeiras 'abs(resto)' partes recebem quociente - 1
    if (resto > 0) {
      return new Dinheiro(index < resto ? quociente + 1 : quociente)
    } else if (resto < 0) {
      return new Dinheiro(index < Math.abs(resto) ? quociente - 1 : quociente)
    }

    return new Dinheiro(quociente)
  }
}
