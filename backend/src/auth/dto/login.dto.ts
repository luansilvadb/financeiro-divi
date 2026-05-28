import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Nome de usuário para autenticação (case-insensitive)',
    example: 'luan.silva',
  })
  @IsNotEmpty()
  @IsString()
  username!: string;

  @ApiProperty({
    description: 'Senha de acesso do usuário',
    example: 'senhaSegura123',
  })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
