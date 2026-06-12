import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidationStatusDto {
  @ApiProperty({ description: 'Data de criação da casa' })
  tenantCreatedAt!: Date;

  @ApiPropertyOptional({ description: 'Data em que o segundo usuário real entrou na casa' })
  secondLinkedMemberAt!: Date | null;

  @ApiPropertyOptional({ description: 'Data do primeiro gasto comum registrado' })
  firstExpenseAt!: Date | null;

  @ApiProperty({ description: 'Períodos fechados no formato YYYY-MM', type: [String] })
  closedPeriods!: string[];

  @ApiPropertyOptional({ description: 'Data do primeiro acerto registrado' })
  firstSettlementAt!: Date | null;

  @ApiProperty({ description: 'Indica se a casa concluiu os marcos mínimos de ativação' })
  activationComplete!: boolean;

  @ApiProperty({ description: 'Indica se a casa fechou pelo menos dois períodos distintos' })
  repeatedValue!: boolean;
}
