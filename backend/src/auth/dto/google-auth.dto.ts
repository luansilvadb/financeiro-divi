import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'ID Token do Google (JWT de credencial retornado pelo Google Identity Services)',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE...Y2I5NjBkODFiMmFjY2I5NjBkODFiMmFj',
  })
  @IsNotEmpty()
  @IsString()
  credential!: string;

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
