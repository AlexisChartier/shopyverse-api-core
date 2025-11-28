import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { AssignProductsToPromotionDto } from './dto/assign-products.dto';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPromotionDto: CreatePromotionDto) {
    // Validation simple : Date fin > Date début
    if (
      new Date(createPromotionDto.endDate) <=
      new Date(createPromotionDto.startDate)
    ) {
      throw new BadRequestException(
        'La date de fin doit être après la date de début',
      );
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
        products: { include: { product: true } }, // Voir les produits associés
      },
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
    async assignProductsToPromotion(
    promotionId: string,
    dto: AssignProductsToPromotionDto,
  ) {
    // Vérifier que la promotion existe
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new BadRequestException(`Promotion #${promotionId} introuvable`);
    }

    const { productIds } = dto;

    if (!productIds || productIds.length === 0) {
      throw new BadRequestException('Aucun productId fourni');
    }

    // On crée des lignes dans la table de liaison ProductPromotion
    const result = await this.prisma.productPromotion.createMany({
      data: productIds.map((productId) => ({
        productId,
        promotionId,
      })),
      skipDuplicates: true, // évite les erreurs si déjà lié
    });

    return {
      promotionId,
      linkedCount: result.count,
    };
  }
}
