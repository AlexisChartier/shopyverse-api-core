import { IsDateString, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export const STOREFRONT_EVENT_NAMES = [
  'filter.search',
  'filter.category',
  'filter.sort',
  'filter.reset',
  'cart.added',
  'cart.removed',
  'cart.updated',
  'recommendation.click',
  'recommendation.add_to_cart',
] as const;

export type StorefrontEventName = (typeof STOREFRONT_EVENT_NAMES)[number];

export class StorefrontEventDto {
  @IsString()
  @IsIn(STOREFRONT_EVENT_NAMES)
  name!: StorefrontEventName;

  @IsOptional()
  @IsString()
  visitorId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
