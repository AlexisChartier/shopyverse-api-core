import { IsOptional, IsString } from 'class-validator';
import type { Prisma } from '@prisma/client';

export class CreateAuditDto {
  @IsString()
  action!: string;

  @IsString()
  userId!: string;

  @IsOptional()
  details?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
}
