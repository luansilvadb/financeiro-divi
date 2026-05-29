import { Module } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { FinanceiroController } from './financeiro.controller';
import { AuthModule } from '../auth/auth.module';
import { FinanceiroGateway } from './financeiro.gateway';

@Module({
  imports: [AuthModule],
  providers: [FinanceiroService, FinanceiroGateway],
  controllers: [FinanceiroController],
  exports: [FinanceiroService],
})
export class FinanceiroModule {}
