import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class FinanceiroGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(FinanceiroGateway.name);

  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('joinTenant')
  async handleJoinTenant(
    @MessageBody() data: { tenantId: string; token?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { tenantId, token } = data;
    if (!tenantId) {
      return { status: 'error', message: 'tenantId is required' };
    }
    if (!token) {
      return { status: 'error', message: 'token is required' };
    }

    const decoded = this.authService.validarToken(token);
    if (!decoded || !decoded.sub) {
      this.logger.warn(`Cliente ${client.id} tentou registrar-se no tenant com token inválido.`);
      return { status: 'error', message: 'Invalid or expired token' };
    }

    try {
      const membro = await this.prisma.membroCasa.findFirst({
        where: {
          tenantId,
          userId: decoded.sub,
        },
      });

      if (!membro) {
        this.logger.warn(`Usuário ${decoded.username} (${decoded.sub}) tentou acessar tenant ${tenantId} sem pertencer a ele.`);
        return { status: 'error', message: 'Access denied to this tenant' };
      }

      client.join(tenantId);
      this.logger.log(`Cliente ${client.id} (usuário: ${decoded.username}) entrou na sala do tenant: ${tenantId}`);
      return { status: 'success', room: tenantId };
    } catch (dbError) {
      this.logger.error(`Erro ao validar acesso do usuário ${decoded.sub} ao tenant ${tenantId}:`, dbError);
      return { status: 'error', message: 'Invalid tenantId format or database error' };
    }
  }

  notificarAlteracao(tenantId: string, event: string, payload?: any) {
    if (!this.server) {
      this.logger.warn('Servidor Socket.io não inicializado. Não foi possível enviar notificação.');
      return;
    }
    this.logger.log(`Emitindo evento "${event}" para o tenant "${tenantId}"`);
    this.server.to(tenantId).emit(event, payload);
  }
}
