import { Module, forwardRef } from '@nestjs/common';
import { MembroService } from './membro.service';
import { CargoService } from './cargo.service';
import { CartaoService } from './cartao.service';
import { LancamentoService } from './lancamento.service';
import { FinanceiroController } from './financeiro.controller';
import { AuthModule } from '../auth/auth.module';
import { FinanceiroGateway } from './financeiro.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  providers: [
    MembroService, 
    CargoService, 
    CartaoService, 
    LancamentoService, 
    FinanceiroGateway
  ],
  controllers: [FinanceiroController],
  exports: [MembroService, FinanceiroGateway],
})
export class FinanceiroModule {}
