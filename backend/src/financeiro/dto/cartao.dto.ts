import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CartaoDto {
  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsNotEmpty()
  @IsString()
  nome!: string;

  @IsNotEmpty()
  @IsNumber()
  diaFechamento!: number;

  @IsNotEmpty()
  @IsString()
  responsavelPadraoId!: string;
}
