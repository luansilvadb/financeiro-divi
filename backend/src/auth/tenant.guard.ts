import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const tid = req.headers['x-tenant-id'];
    const uid = req.user?.userId;
    if (!tid) return true;
    if (!uid) return false;
    const m = await this.prisma.membroCasa.findFirst({ where: { tenantId: tid, userId: uid } });
    if (!m) throw new ForbiddenException('Acesso negado à esta casa.');
    return true;
  }
}
