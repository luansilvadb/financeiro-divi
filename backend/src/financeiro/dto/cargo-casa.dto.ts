import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class CargoCasaDto {
  @ApiPropertyOptional({
    description: 'ID exclusivo do cargo (gerado no backend ou UUID)',
    example: 'cargo-f87a32cd-b148-43d9-9524-12499d3dc747',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Nome do cargo personalizado',
    example: 'Financeiro',
  })
  @IsNotEmpty()
  @IsString()
  nome!: string;

  @ApiPropertyOptional({
    description: 'Cor do badge associado ao cargo (código hex ou string CSS)',
    example: '#f59e0b',
  })
  @IsOptional()
  @IsString()
  cor?: string;

  @ApiProperty({
    description: 'Lista de chaves de permissão atribuídas a este cargo',
    example: ['lancamentos', 'cartoes_proprios'],
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  permissoes!: string[];
}
