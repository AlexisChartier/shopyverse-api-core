import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsUUID,
} from 'class-validator';

export class AssignProductsDto {
  @ApiProperty({
    type: [String],
    example: [
      'b3a3d0e1-1234-4567-890a-bcdef0123456',
      'c4b5f1a2-2345-5678-901b-cdef01234567',
    ],
    description: 'Liste des IDs de produits à assigner à cette catégorie',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  productIds: string[];
}
