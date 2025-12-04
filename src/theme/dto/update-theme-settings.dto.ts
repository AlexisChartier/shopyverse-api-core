import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const HEADER_LAYOUTS = ['centered', 'left', 'minimal'] as const;

type HeaderLayout = (typeof HEADER_LAYOUTS)[number];

export class UpdateThemeSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(7)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  accentColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fontFamily?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  storeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  storeDescription?: string;

  @IsOptional()
  @IsString()
  @IsIn(HEADER_LAYOUTS)
  headerLayout?: HeaderLayout;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  footerText?: string;
}
