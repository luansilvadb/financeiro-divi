import { io, Socket } from 'socket.io-client'

export class SocketService {
  private socket: Socket | null = null
  private currentTenantId: string | null = null

  private get baseUrl(): string {
    return (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'
  }

  conectar(tenantId: string): void {
    if (this.socket && this.currentTenantId === tenantId) {
      return
    }

    if (this.socket) {
      this.desconectar()
    }

    this.currentTenantId = tenantId
    console.log(`[SocketService] Conectando ao socket em ${this.baseUrl} para o tenant ${tenantId}`)
    
    this.socket = io(this.baseUrl, {
      transports: ['websocket'],
      autoConnect: true
    })

    this.socket.on('connect', () => {
      const token = localStorage.getItem('divi_jwt_token') || ''
      console.log(`[SocketService] Conectado. Enviando joinTenant para ${tenantId}`)
      this.socket?.emit('joinTenant', { tenantId, token }, (res: any) => {
        console.log('[SocketService] Resposta do joinTenant:', res)
      })
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Desconectado:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Erro de conexão:', error)
    })
  }

  desconectar(): void {
    if (this.socket) {
      console.log('[SocketService] Desconectando socket')
      this.socket.disconnect()
      this.socket = null
    }
    this.currentTenantId = null
  }

  on(event: string, callback: (payload?: any) => void): void {
    if (this.socket) {
      this.socket.off(event)
      this.socket.on(event, callback)
    } else {
      console.warn(`[SocketService] Tentou registrar evento "${event}" sem socket conectado.`)
    }
  }

  off(event: string): void {
    if (this.socket) {
      this.socket.off(event)
    }
  }
}
