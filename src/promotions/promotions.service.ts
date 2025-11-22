import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPromotionDto: CreatePromotionDto) {
    // Validation simple : Date fin > Date début
    if (new Date(createPromotionDto.endDate) <= new Date(createPromotionDto.startDate)) {
      throw new BadRequestException('La date de fin doit être après la date de début');
    }

    return this.prisma.promotion.create({
      data: {
        ...createPromotionDto,
        // Conversion explicite si besoin, mais @IsDateString gère le format ISO
      },
    });
  }

  async findAll() {
    return this.prisma.promotion.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.promotion.findUnique({
      where: { id },
      include: { 
        products: { include: { product: true } } // Voir les produits associés
      }
    });
  }

  async update(id: string, updatePromotionDto: UpdatePromotionDto) {
    return this.prisma.promotion.update({
      where: { id },
      data: updatePromotionDto,
    });
  }

  async remove(id: string) {
    return this.prisma.promotion.delete({
      where: { id },
    });
  }
}