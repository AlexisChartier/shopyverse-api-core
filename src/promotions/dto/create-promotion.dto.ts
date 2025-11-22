import { IsString, IsOptional, IsNumber, IsDateString, IsBoolean, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export class CreatePromotionDto {
  @ApiProperty({ example: 'SUMMER2025', description: 'Code promo unique (optionnel)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ enum: PromotionType, example: PromotionType.PERCENTAGE })
  @IsEnum(PromotionType)
  type: string;

  @ApiProperty({ example: 20, description: 'Valeur de la réduction (ex: 20% ou 20€)' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: '2025-06-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-09-01T00:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}