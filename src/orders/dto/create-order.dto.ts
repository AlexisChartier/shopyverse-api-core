import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ShippingAddressDto {
  @ApiProperty({ example: '123 Rue de la Paix' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Île-de-France' })
  @IsString()
  state: string;

  @ApiProperty({ example: '75001' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 'France' })
  @IsString()
  country: string;
}

class CreateOrderItemDto {
  @ApiProperty({ example: 'prod-123', required: false })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ example: 'Casque Audio Sans Fil' })
  @IsString()
  productName: string;

  @ApiProperty({ example: 1 })
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 299.99 })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'ORD-1001' })
  @IsString()
  orderNumber: string;

  @ApiProperty({ example: 'customer-uuid-1' })
  @IsString()
  customerId: string;

  @ApiProperty({ enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, required: false })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({ example: 299.99 })
  @IsNumber()
  subtotal: number;

  @ApiProperty({ example: 60 })
  @IsNumber()
  tax: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  shipping: number;

  @ApiProperty({ example: 369.99 })
  @IsNumber()
  total: number;

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export { ShippingAddressDto, CreateOrderItemDto };
