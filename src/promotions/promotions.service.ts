import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { AssignProductsToPromotionDto } from './dto/assign-products.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(createPromotionDto: CreatePromotionDto, userId?: string) {
    // Validation simple : Date fin > Date début
    if (
      new Date(createPromotionDto.endDate) <=
      new Date(createPromotionDto.startDate)
    ) {
      throw new BadRequestException(
        'La date de fin doit être après la date de début',
      );
    }

    const promotion = await this.prisma.promotion.create({
      data: {
        ...createPromotionDto,
        // Conversion explicite si besoin, mais @IsDateString gère le format ISO
      },
    });

    if (userId) {
      await this.auditService.log('promotion.create', userId, {
        promotionId: promotion.id,
        code: promotion.code,
      });
    }

    return promotion;
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

  async update(
    id: string,
    updatePromotionDto: UpdatePromotionDto,
    userId?: string,
  ) {
    const updated = await this.prisma.promotion.update({
      where: { id },
      data: updatePromotionDto,
    });

    if (userId) {
      await this.auditService.log('promotion.update', userId, {
        promotionId: id,
      });
    }

    return updated;
  }

  async remove(id: string, userId?: string) {
    const deleted = await this.prisma.promotion.delete({
      where: { id },
    });

    if (userId) {
      await this.auditService.log('promotion.delete', userId, {
        promotionId: id,
      });
    }

    return deleted;
  }
  async assignProductsToPromotion(
    promotionId: string,
    dto: AssignProductsToPromotionDto,
    userId?: string,
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

    if (userId) {
      await this.auditService.log('promotion.assignProducts', userId, {
        promotionId,
        productIds,
      });
    }

    return {
      promotionId,
      linkedCount: result.count,
    };
  }
}
