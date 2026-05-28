import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ExcluirMuitosGastosDto {
  @ApiProperty({
    description: 'Array de IDs de gastos a serem excluídos em lote',
    example: ['f87a32cd-b148-43d9-9524-12499d3dc747', 'c130ee44-934c-473d-82d8-bf5ce3d80ea4'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
