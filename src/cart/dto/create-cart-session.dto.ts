import { IsOptional, IsString, Length } from 'class-validator';

export class CreateCartSessionDto {
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
