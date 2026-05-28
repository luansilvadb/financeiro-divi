import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class ContaFixaDto {
  @ApiProperty({
    description: 'ID exclusivo da conta fixa',
    example: 'cf1-d3b07384-d113-4c4c-a110-230c45aa835b',
  })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'Nome amigável da conta fixa',
    example: 'Netflix',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Ícone identificador da conta (pode ser classe de ícone ou emoji)',
    example: 'tv',
  })
  @IsNotEmpty()
  @IsString()
  icon!: string;

  @ApiPropertyOptional({
    description: 'Valor fixo estimado em centavos (caso o valor não mude mensalmente)',
    example: 5590,
  })
  @IsOptional()
  @IsNumber()
  fixedValueCentavos?: number;

  @ApiProperty({
    description: 'Lista de IDs dos membros que dividem esta conta por padrão',
    example: ['m1-f87a32cd-b148-43d9-9524-12499d3dc747', 'm2-c130ee44-934c-473d-82d8-bf5ce3d80ea4'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  defaultSplit!: string[];
}
