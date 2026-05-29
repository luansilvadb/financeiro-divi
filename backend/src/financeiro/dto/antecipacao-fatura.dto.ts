import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AntecipacaoFaturaDto {
  @ApiProperty({ example: 'ant-1' })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiProperty({ example: 'fat-1' })
  @IsNotEmpty()
  @IsString()
  faturaId!: string;

  @ApiProperty({ example: 'membro-joao' })
  @IsNotEmpty()
  @IsString()
  membroId!: string;

  @ApiProperty({ example: 'membro-luan' })
  @IsNotEmpty()
  @IsString()
  responsavelId!: string;

  @ApiProperty({ example: 10000 })
  @IsNotEmpty()
  @IsNumber()
  valorCentavos!: number;

  @ApiProperty({ example: '2026-05-29T12:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  data!: string;

  @ApiPropertyOptional({ example: 'Liberar limite do cartao' })
  @IsOptional()
  @IsString()
  observacao?: string | null;
}
