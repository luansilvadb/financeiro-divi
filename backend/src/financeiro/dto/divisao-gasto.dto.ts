import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class DivisaoGastoDto {
  @ApiProperty({
    description: 'ID do membro que participa do rateio',
    example: 'm1-f87a32cd-b148-43d9-9524-12499d3dc747',
  })
  @IsNotEmpty()
  @IsString()
  membroId!: string;

  @ApiProperty({
    description: 'Valor em centavos atribuído a este membro na divisão',
    example: 1500,
  })
  @IsNotEmpty()
  @IsNumber()
  valorCentavos!: number;
}
