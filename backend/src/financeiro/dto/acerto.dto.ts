import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class AcertoDto {
  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsNotEmpty()
  @IsString()
  faturaId!: string;

  @IsNotEmpty()
  @IsString()
  membroId!: string;

  @IsNotEmpty()
  @IsNumber()
  totalConsumidoCentavos!: number;

  @IsOptional()
  @IsNumber()
  valorPagoCentavos?: number;

  @IsNotEmpty()
  @IsBoolean()
  pago!: boolean;

  @IsOptional()
  @IsString()
  dataPagamento?: string;
}
