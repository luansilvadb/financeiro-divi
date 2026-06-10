import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

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
    description: 'Status de ativação do membro na casa',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({
    description: 'Cargo/Permissão do morador (ADMIN, MORADOR, VISUALIZADOR)',
    enum: Role,
    example: Role.MORADOR,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'ID do usuário associado (opcional se for um membro sem login na plataforma)',
    example: 'user-a68ef338-7bb7-4fb8-9bb3-90d2948bb74e',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'ID do cargo personalizado associado ao morador',
    example: 'cargo-f87a32cd-b148-43d9-9524-12499d3dc747',
  })
  @IsOptional()
  @IsString()
  cargoId?: string;

  @ApiPropertyOptional({
    description: 'E-mail para criar um novo login para este membro (opcional)',
    example: 'joao@silva.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Senha para o novo login deste membro (opcional)',
    example: 'senha123',
  })
  @IsOptional()
  @IsString()
  password?: string;
}
