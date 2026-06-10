import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TenantRoleGuard } from './auth/tenant-role.guard';

import { MailModule } from './shared/mail/mail.module';

@Module({
  imports: [PrismaModule, AuthModule, FinanceiroModule, MailModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantRoleGuard,
    },
  ],
})
export class AppModule {}
