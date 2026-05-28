import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class AcertoDto {
  @ApiProperty({
    description: 'ID exclusivo do acerto',
    example: 'ac1-d3b07384-d113-4c4c-a110-230c45aa835b',
  })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'ID da fatura associada a este acerto',
    example: 'f1-e5a1b32d-2098-4d56-b7ff-11c57bc98188',
  })
  @IsNotEmpty()
  @IsString()
  faturaId!: string;

  @ApiProperty({
    description: 'ID do membro cujos gastos estão sendo acertados',
    example: 'm1-f87a32cd-b148-43d9-9524-12499d3dc747',
  })
  @IsNotEmpty()
  @IsString()
  membroId!: string;

  @ApiProperty({
    description: 'Total consumido por este membro na fatura em centavos',
    example: 8750,
  })
  @IsNotEmpty()
  @IsNumber()
  totalConsumidoCentavos!: number;

  @ApiPropertyOptional({
    description: 'Valor pago pelo membro em centavos',
    example: 8750,
  })
  @IsOptional()
  @IsNumber()
  valorPagoCentavos?: number;

  @ApiProperty({
    description: 'Status do pagamento do acerto (pago ou pendente)',
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  pago!: boolean;

  @ApiPropertyOptional({
    description: 'Data em que o acerto foi pago (formato ISO)',
    example: '2026-05-12T10:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  dataPagamento?: string;
}
