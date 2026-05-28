import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FinanceiroModule } from './financeiro/financeiro.module';

@Module({
  imports: [PrismaModule, AuthModule, FinanceiroModule],
})
export class AppModule {}
