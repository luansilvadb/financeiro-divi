import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class FaturaDto {
  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsNotEmpty()
  @IsString()
  cartaoId!: string;

  @IsNotEmpty()
  @IsNumber()
  mes!: number;

  @IsNotEmpty()
  @IsNumber()
  ano!: number;

  @IsNotEmpty()
  @IsString()
  responsavelId!: string;

  @IsNotEmpty()
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  dataPagamentoBanco?: string;
}
