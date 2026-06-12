import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional, ValidateNested, IsArray, IsObject, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { DivisaoGastoDto } from './divisao-gasto.dto';
import { SplitMode } from '@prisma/client';

export class GastoDto {
  @ApiProperty({
    description: 'ID exclusivo do gasto',
    example: 'g1-e5a1b32d-2098-4d56-b7ff-11c57bc98188',
  })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiPropertyOptional({
    description: 'ID da fatura associada a este gasto (opcional para gastos avulsos)',
    example: 'f1-e5a1b32d-2098-4d56-b7ff-11c57bc98188',
  })
  @IsOptional()
  @IsString()
  faturaId?: string;

  @ApiProperty({
    description: 'Descrição ou nome do gasto',
    example: 'Supermercado da semana',
  })
  @IsNotEmpty()
  @IsString()
  descricao!: string;

  @ApiProperty({
    description: 'Valor total do gasto em centavos',
    example: 15000,
  })
  @IsNotEmpty()
  @IsNumber()
  valorTotalCentavos!: number;

  @ApiProperty({
    description: 'ID do membro que efetuou a compra (comprador)',
    example: 'm1-f87a32cd-b148-43d9-9524-12499d3dc747',
  })
  @IsNotEmpty()
  @IsString()
  compradorId!: string;

  @ApiProperty({
    description: 'Número da parcela atual',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  installments!: number;

  @ApiProperty({
    description: 'Total de parcelas da compra (1 para compras à vista)',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  totalInstallments!: number;

  @ApiProperty({
    description: 'Informa se este gasto é um empréstimo feito a outro membro',
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  isLoan!: boolean;

  @ApiPropertyOptional({
    description: 'ID do membro tomador do empréstimo (obrigatório se isLoan for true)',
    example: 'm2-c130ee44-934c-473d-82d8-bf5ce3d80ea4',
  })
  @IsOptional()
  @IsString()
  borrowerId?: string;

  @ApiPropertyOptional({
    description: 'ID da conta fixa que originou este gasto (caso seja uma conta fixa convertida)',
    example: 'cf1-d3b07384-d113-4c4c-a110-230c45aa835b',
  })
  @IsOptional()
  @IsString()
  recurringBillId?: string;

  @ApiProperty({
    description: 'Informa se este gasto é um acerto/pagamento entre membros',
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  isSettlement!: boolean;

  @ApiPropertyOptional({
    description: 'Detalhes adicionais do acerto (se aplicável)',
    example: 'Acerto ref. fatura de Maio',
  })
  @IsOptional()
  @IsObject()
  settlementDetails?: {
    fromMemberId: string;
    toMemberId: string;
    method: string;
  } | null;

  @ApiProperty({
    description: 'Método de pagamento do gasto (ex: CREDIT_CARD, DEBIT, MONEY, PIX)',
    example: 'CREDIT_CARD',
  })
  @IsNotEmpty()
  @IsString()
  method!: string;

  @ApiPropertyOptional({
    description: 'ID do dono do cartão de crédito (opcional se method for CREDIT_CARD)',
    example: 'm1-f87a32cd-b148-43d9-9524-12499d3dc747',
  })
  @IsOptional()
  @IsString()
  cardOwnerId?: string;

  @ApiPropertyOptional({
    description: 'ID do grupo de parcelas para vincular compras parceladas',
    example: 'g-parcelas-e5a1b32d-2098-4d56-b7ff',
  })
  @IsOptional()
  @IsString()
  grupoParcelasId?: string;

  @ApiProperty({
    description: 'Rateio de divisão do gasto entre os membros',
    type: [DivisaoGastoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DivisaoGastoDto)
  divisoes!: DivisaoGastoDto[];

  @ApiPropertyOptional({
    description: 'Informa se este gasto é privado (visível apenas para o comprador/pagador)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Critério de rateio escolhido no momento do lançamento',
    enum: SplitMode,
    example: SplitMode.EQUAL,
  })
  @IsOptional()
  @IsEnum(SplitMode)
  splitMode?: SplitMode;
}
