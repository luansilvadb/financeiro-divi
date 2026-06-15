import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'E-mail do usuário para envio do link/código de recuperação de senha',
    example: 'joao@silva.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
