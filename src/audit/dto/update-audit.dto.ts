import { IsOptional, IsString } from 'class-validator';
import type { Prisma } from '@prisma/client';

export class UpdateAuditDto {
	@IsOptional()
	@IsString()
	action?: string;

	@IsOptional()
	details?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
}
