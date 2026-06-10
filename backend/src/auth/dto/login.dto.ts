import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'E-mail para autenticação',
    example: 'luan@example.com',
  })
  @IsNotEmpty()
  @IsString()
  email!: string;

  @ApiProperty({
    description: 'Senha de acesso do usuário',
    example: 'senhaSegura123',
  })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
