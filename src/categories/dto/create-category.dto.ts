import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Vêtements', description: 'Nom de la catégorie' })
  @IsString()
  name: string;

  @ApiProperty({ 
    example: 'uuid-parent-123', 
    description: 'ID de la catégorie parente (optionnel)',
    required: false 
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}