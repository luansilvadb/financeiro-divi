import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CriarTenantDto {
  @ApiProperty({
    description: 'Nome da nova casa/tenant que será criado',
    example: 'Minha Casa Divi',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;
}
