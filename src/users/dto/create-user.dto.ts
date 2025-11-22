import { IsEmail, IsNotEmpty, IsString, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'admin@shopyverse.com' })
  @IsEmail({}, { message: 'L\'email doit être valide' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @ApiProperty({ example: 'Jean' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Dupont' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'uuid-role-admin', description: 'ID du rôle (Admin ou Manager)' })
  @IsUUID()
  roleId: string;
}