import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CartaoDto {
  @ApiProperty({
    description: 'ID exclusivo do cartão de crédito',
    example: 'c1-d3b07384-d113-4c4c-a110-230c45aa835b',
  })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'Nome personalizado do cartão de crédito',
    example: 'Nubank Luan',
  })
  @IsNotEmpty()
  @IsString()
  nome!: string;

  @ApiProperty({
    description: 'Dia de fechamento da fatura do cartão (1 a 31)',
    example: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  diaFechamento!: number;

  @ApiProperty({
    description: 'ID do membro responsável padrão por pagar as faturas deste cartão',
    example: 'm1-f87a32cd-b148-43d9-9524-12499d3dc747',
  })
  @IsNotEmpty()
  @IsString()
  responsavelPadraoId!: string;
}
