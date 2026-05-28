import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EntrarTenantDto {
  @ApiProperty({
    description: 'Código de convite único do tenant no qual deseja entrar',
    example: 'MINHA-CASA-123',
  })
  @IsNotEmpty()
  @IsString()
  inviteCode!: string;
}
