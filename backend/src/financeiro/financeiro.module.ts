import { Module, forwardRef } from '@nestjs/common';
import { MembroService } from './membro.service';
import { CartaoService } from './cartao.service';
import { LancamentoService } from './lancamento.service';
import { AuditLogService } from './audit-log.service';
import { FinanceiroController } from './financeiro.controller';
import { AuthModule } from '../auth/auth.module';
import { FinanceiroGateway } from './financeiro.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductValidationService } from './product-validation.service';
import { PermissaoService } from './permissao.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  providers: [
    MembroService, 
    CartaoService, 
    LancamentoService, 
    AuditLogService,
    ProductValidationService,
    PermissaoService,
    FinanceiroGateway
  ],
  controllers: [FinanceiroController],
  exports: [MembroService, AuditLogService, ProductValidationService, PermissaoService, FinanceiroGateway],
})
export class FinanceiroModule {}
