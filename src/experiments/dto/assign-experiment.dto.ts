import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class AssignExperimentDto {
  @IsString()
  experimentId!: string;

  @IsOptional()
  @IsString()
  visitorId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsBoolean()
  recordExposure?: boolean;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
