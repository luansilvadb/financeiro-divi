import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

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
}
