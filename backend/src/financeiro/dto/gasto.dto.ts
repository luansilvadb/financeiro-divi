import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { DivisaoGastoDto } from './divisao-gasto.dto';

export class GastoDto {
  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsNotEmpty()
  @IsString()
  faturaId!: string;

  @IsNotEmpty()
  @IsString()
  descricao!: string;

  @IsNotEmpty()
  @IsNumber()
  valorTotalCentavos!: number;

  @IsNotEmpty()
  @IsString()
  compradorId!: string;

  @IsNotEmpty()
  @IsNumber()
  installments!: number;

  @IsNotEmpty()
  @IsNumber()
  totalInstallments!: number;

  @IsNotEmpty()
  @IsBoolean()
  isLoan!: boolean;

  @IsOptional()
  @IsString()
  borrowerId?: string;

  @IsOptional()
  @IsString()
  recurringBillId?: string;

  @IsNotEmpty()
  @IsBoolean()
  isSettlement!: boolean;

  @IsOptional()
  @IsString()
  settlementDetails?: string;

  @IsNotEmpty()
  @IsString()
  method!: string;

  @IsOptional()
  @IsString()
  cardOwnerId?: string;

  @IsOptional()
  @IsString()
  grupoParcelasId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DivisaoGastoDto)
  divisoes!: DivisaoGastoDto[];
}
