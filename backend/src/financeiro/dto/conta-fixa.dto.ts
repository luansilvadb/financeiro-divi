import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class ContaFixaDto {
  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  icon!: string;

  @IsOptional()
  @IsNumber()
  fixedValueCentavos?: number;

  @IsArray()
  @IsString({ each: true })
  defaultSplit!: string[];
}
