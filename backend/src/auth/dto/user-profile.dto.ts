import { ApiProperty } from '@nestjs/swagger';

export class UserTenantDto {
  @ApiProperty({
    description: 'ID do Tenant (casa) associada',
    example: 'd3b07384-d113-4c4c-a110-230c45aa835b',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome do Tenant (casa)',
    example: 'Apartamento 402',
  })
  name!: string;

  @ApiProperty({
    description: 'Código de convite único do Tenant',
    example: 'AP402-XYZ',
  })
  inviteCode!: string;
}

export class UserProfileDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: 'a68ef338-7bb7-4fb8-9bb3-90d2948bb74e',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome de usuário',
    example: 'luan.silva',
  })
  username!: string;

  @ApiProperty({
    description: 'Lista de Tenants (casas) de que o usuário participa',
    type: [UserTenantDto],
  })
  tenants!: UserTenantDto[];
}
