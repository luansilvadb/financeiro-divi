export const mensagemErro = (erro: unknown, fallback: string): string => {
  return erro instanceof Error && erro.message ? erro.message : fallback
}
