import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class FaturaDto {
  @ApiProperty({
    description: 'ID exclusivo da fatura',
    example: 'f1-e5a1b32d-2098-4d56-b7ff-11c57bc98188',
  })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'ID do cartão de crédito ao qual esta fatura pertence',
    example: 'c1-d3b07384-d113-4c4c-a110-230c45aa835b',
  })
  @IsNotEmpty()
  @IsString()
  cartaoId!: string;

  @ApiProperty({
    description: 'Mês de referência da fatura (1 a 12)',
    example: 5,
  })
  @IsNotEmpty()
  @IsNumber()
  mes!: number;

  @ApiProperty({
    description: 'Ano de referência da fatura',
    example: 2026,
  })
  @IsNotEmpty()
  @IsNumber()
  ano!: number;

  @ApiProperty({
    description: 'ID do membro responsável por pagar esta fatura específica',
    example: 'm1-f87a32cd-b148-43d9-9524-12499d3dc747',
  })
  @IsNotEmpty()
  @IsString()
  responsavelId!: string;

  @ApiProperty({
    description: 'Status atual da fatura (ex: Aberta, Fechada, Paga)',
    example: 'Aberta',
  })
  @IsNotEmpty()
  @IsString()
  status!: string;

  @ApiPropertyOptional({
    description: 'Data em que a fatura foi paga no banco (formato ISO)',
    example: '2026-05-10T15:30:00.000Z',
  })
  @IsOptional()
  @IsString()
  dataPagamentoBanco?: string;
}
