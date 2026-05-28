import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class MembroDto {
  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsNotEmpty()
  @IsString()
  nome!: string;

  @IsNotEmpty()
  @IsString()
  avatar!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
