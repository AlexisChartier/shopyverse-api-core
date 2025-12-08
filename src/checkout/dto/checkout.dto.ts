import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class CheckoutCustomerDto {
  @ApiProperty({ example: 'Marie' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'marie.dupont@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+33 6 12 34 56 78', required: false })
  @IsString()
  phone?: string;
}

export class CheckoutAddressDto {
  @ApiProperty({ example: '24 rue des Fleurs' })
  @IsString()
  street!: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  city!: string;

  @ApiProperty({ example: 'Île-de-France' })
  @IsString()
  state!: string;

  @ApiProperty({ example: '75011' })
  @IsString()
  postalCode!: string;

  @ApiProperty({ example: 'France' })
  @IsString()
  country!: string;
}

export class CheckoutRequestDto {
  @ApiProperty({ example: 'session-uuid' })
  @IsString()
  sessionId!: string;

  @ApiProperty({ enum: ['card', 'paypal', 'bank'], example: 'card' })
  @IsString()
  paymentMethod!: string;

  @ApiProperty({ type: CheckoutCustomerDto })
  @ValidateNested()
  @Type(() => CheckoutCustomerDto)
  customer!: CheckoutCustomerDto;

  @ApiProperty({ type: CheckoutAddressDto })
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  shippingAddress!: CheckoutAddressDto;
}
