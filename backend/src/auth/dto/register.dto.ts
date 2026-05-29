import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Nome de usuário desejado (único e case-insensitive)',
    example: 'luan.silva',
  })
  @IsNotEmpty()
  @IsString()
  username!: string;

  @ApiProperty({
    description: 'Senha de acesso (mínimo de 6 caracteres)',
    example: 'senhaSegura123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    description: 'Código de convite da casa (opcional para vínculo automático no registro)',
    example: 'CASA-XYZ12',
    required: false
  })
  @IsString()
  @IsOptional()
  inviteCode?: string;

  @ApiProperty({
    description: 'ID do membro da casa para vincular ao novo usuário (opcional)',
    example: 'membro-123',
    required: false
  })
  @IsString()
  @IsOptional()
  membroId?: string;
}
