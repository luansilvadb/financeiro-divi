import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    description: 'ID exclusivo gerado para o novo usuário',
    example: 'a68ef338-7bb7-4fb8-9bb3-90d2948bb74e',
  })
  userId!: string;

  @ApiProperty({
    description: 'Nome do usuário recém-registrado',
    example: 'luan.silva',
  })
  username!: string;
}
