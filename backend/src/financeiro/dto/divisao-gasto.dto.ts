import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class DivisaoGastoDto {
  @IsNotEmpty()
  @IsString()
  membroId!: string;

  @IsNotEmpty()
  @IsNumber()
  valorCentavos!: number;
}
