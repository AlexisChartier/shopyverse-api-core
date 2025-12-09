import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ImportStockItemDto {
  @ApiProperty({ example: 'SKU-123' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(0)
  stockQty: number;

  @ApiProperty({ example: 5, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  alertThreshold?: number;
}

export class ImportStockDto {
  @ApiProperty({ type: [ImportStockItemDto], required: false })
  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  items?: ImportStockItemDto[];

  @ApiProperty({
    example: 'sku,stockQty,alertThreshold\nSKU-1,10,5',
    required: false,
  })
  @IsString()
  @IsOptional()
  csv?: string;
}
