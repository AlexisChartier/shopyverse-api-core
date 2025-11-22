import { Type } from 'class-transformer';
import { 
  IsArray, IsBoolean, IsInt, IsNumber, IsObject, IsOptional, 
  IsString, Min, ValidateNested 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Pour la doc auto

// --- Sous-DTO pour les Variantes ---
export class CreateVariantDto {
  @ApiProperty({ example: 'TSHIRT-BLK-L' })
  @IsString()
  sku: string;

  @ApiProperty({ example: { size: 'L', color: 'Black' } })
  @IsObject()
  attributes: Record<string, any>; // Stocké en JSONB

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  stockQty: number;
}

// --- Sous-DTO pour les Médias ---
export class CreateMediaDto {
  @ApiProperty({ example: 'https://cdn.shopyverse.com/img1.jpg' })
  @IsString()
  url: string;

  @ApiProperty({ example: 'Vue de face' })
  @IsString()
  @IsOptional()
  altText?: string;
}

// --- DTO Principal Produit ---
export class CreateProductDto {
  @ApiProperty({ example: 'T-Shirt ShopyVerse' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Un t-shirt en coton bio...' })
  @IsString()
  description: string;

  @ApiProperty({ example: 't-shirt-shopyverse-v1' })
  @IsString()
  slug: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({ example: 'uuid-category-123' })
  @IsString()
  categoryId: string;

  // Validation imbriquée pour les tableaux
  @ApiProperty({ type: [CreateVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants: CreateVariantDto[];

  @ApiProperty({ type: [CreateMediaDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMediaDto)
  @IsOptional()
  medias?: CreateMediaDto[];
}