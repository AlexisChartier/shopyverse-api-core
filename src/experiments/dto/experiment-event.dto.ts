import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export const EXPERIMENT_EVENT_NAMES = [
  'exposure',
  'click',
  'add_to_cart',
  'purchase',
  'conversion',
] as const;

export type ExperimentEventName = (typeof EXPERIMENT_EVENT_NAMES)[number];

export class ExperimentEventDto {
  @IsString()
  experimentId!: string;

  @IsString()
  variantName!: string;

  @IsIn(EXPERIMENT_EVENT_NAMES)
  eventName!: ExperimentEventName;

  @IsOptional()
  @IsString()
  visitorId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
