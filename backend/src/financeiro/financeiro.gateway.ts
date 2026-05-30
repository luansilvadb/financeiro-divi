import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class FinanceiroGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

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
        return { status: 'error', message: 'Access denied to this tenant' };
      }

      client.join(tenantId);
      return { status: 'success', room: tenantId };
    } catch (dbError) {
      return { status: 'error', message: 'Invalid tenantId format or database error' };
    }
  }

  notificarAlteracao(tenantId: string, event: string, payload?: any) {
    this.server.to(tenantId).emit(event, payload);
  }
}
