import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Logger } from './logger'

let logger: Logger

beforeEach(() => {
  vi.restoreAllMocks()
  logger = new Logger()
})

describe('Logger', () => {
  it('deve chamar console.info no nível info', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.setLevel('info')
    logger.info('teste info')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('deve chamar console.warn no nível warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.setLevel('warn')
    logger.warn('teste warn')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('deve chamar console.error no nível error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.setLevel('error')
    logger.error('teste error')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('deve chamar console.debug no nível debug', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    logger.setLevel('debug')
    logger.debug('teste debug')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('não deve chamar console.debug quando nível for info', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    logger.setLevel('info')
    logger.debug('debug silenciado')
    expect(spy).not.toHaveBeenCalled()
  })

  it('não deve chamar console.info quando nível for warn', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.setLevel('warn')
    logger.info('info silenciado')
    expect(spy).not.toHaveBeenCalled()
  })

  it('não deve chamar console.warn quando nível for error', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.setLevel('error')
    logger.warn('warn silenciado')
    expect(spy).not.toHaveBeenCalled()
  })

  it('deve formatar a mensagem com timestamp e nível', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.setLevel('info')
    logger.info('minha mensagem')
    const call = spy.mock.calls[0][0]
    expect(call).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[INFO\] minha mensagem$/)
  })

  it('deve logar argumentos adicionais', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.setLevel('error')
    const err = new Error('falha')
    logger.error('ocorreu um erro', err)
    expect(spy).toHaveBeenCalledWith(expect.any(String), err)
  })

  it('setLevel deve alterar o nível ativo', () => {
    const spyInfo = vi.spyOn(console, 'info').mockImplementation(() => {})
    const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.setLevel('warn')
    logger.info('nao deve logar')
    logger.warn('deve logar')
    expect(spyInfo).not.toHaveBeenCalled()
    expect(spyWarn).toHaveBeenCalledOnce()
  })
})
