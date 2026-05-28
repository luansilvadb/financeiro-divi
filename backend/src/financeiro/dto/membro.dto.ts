import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class MembroDto {
  @ApiProperty({
    description: 'ID exclusivo do membro (gerado no cliente ou UUID)',
    example: 'm1-f87a32cd-b148-43d9-9524-12499d3dc747',
  })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'Nome de exibição do membro da casa',
    example: 'Luan Silva',
  })
  @IsNotEmpty()
  @IsString()
  nome!: string;

  @ApiPropertyOptional({
    description: 'String representando o avatar do membro (ex: cor, emoji ou URL)',
    example: 'https://api.dicebear.com/7.x/bottts/svg?seed=Luan',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'ID do usuário associado (opcional se for um membro sem login na plataforma)',
    example: 'user-a68ef338-7bb7-4fb8-9bb3-90d2948bb74e',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
