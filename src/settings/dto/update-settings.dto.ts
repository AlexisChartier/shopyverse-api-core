import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  currency?: string;

  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @IsOptional()
  @IsNumber()
  shippingRate?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  allowedPaymentMethods?: string[];

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  orderPrefix?: string;
}
