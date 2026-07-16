export const mensagemErro = (erro: unknown, fallback: string): string => {
  if (erro instanceof Error) {
    return erro.message ? erro.message : fallback
  }
  return fallback
}
