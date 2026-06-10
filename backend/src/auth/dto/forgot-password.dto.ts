import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'E-mail do usuário cadastrado',
    example: 'luan@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
