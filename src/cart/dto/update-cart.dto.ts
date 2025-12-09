import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CartItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;
}

export class UpdateCartDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];
}
