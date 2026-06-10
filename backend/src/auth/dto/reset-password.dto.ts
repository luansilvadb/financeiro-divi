import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de recuperação enviado por e-mail',
    example: 'abcdef1234567890abcdef1234567890',
  })
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty({
    description: 'Nova senha (mínimo de 6 caracteres)',
    example: 'novaSenha123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
