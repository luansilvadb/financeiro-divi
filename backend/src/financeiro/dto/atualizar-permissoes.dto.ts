import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class AtualizarPermissoesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ALLOW_LANCAR_GASTO?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ALLOW_GERENCIAR_CARTOES?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ALLOW_GERENCIAR_CONTAS_FIXAS?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ALLOW_REGISTRAR_NETTING?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ALLOW_VER_AUDIT_LOGS?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ALLOW_ALTERAR_RENDA?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ALLOW_ALTERAR_NOME?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ALLOW_FECHAR_PERIODO?: boolean;
}
