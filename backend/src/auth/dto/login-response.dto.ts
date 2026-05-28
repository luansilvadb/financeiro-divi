import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'Token JWT de acesso que deve ser enviado no cabeçalho Authorization como Bearer Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string;

  @ApiProperty({
    description: 'ID exclusivo do usuário no banco de dados',
    example: 'a68ef338-7bb7-4fb8-9bb3-90d2948bb74e',
  })
  userId!: string;

  @ApiProperty({
    description: 'Nome do usuário autenticado',
    example: 'luan.silva',
  })
  username!: string;
}
