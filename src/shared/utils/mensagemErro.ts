export const mensagemErro = (erro: unknown, fallback: string): string => {
  if (erro instanceof Error) {
    // Treat empty string messages as intentional — only fall back for undefined.
    return erro.message !== undefined && erro.message !== null ? erro.message : fallback
  }
  return fallback
}
