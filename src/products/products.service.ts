import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /products
   * Créer un produit avec variantes + médias
   */
  async create(dto: CreateProductDto) {
    const { variants, medias, categoryId, ...productData } = dto;

    return this.prisma.product.create({
      data: {
        ...productData, // title, description, slug, isPublished...
        category: {
          connect: { id: categoryId },
        },
        variants: {
          create: variants.map((v) => ({
            sku: v.sku,
            attributes: v.attributes,
            price: v.price, // Prisma Decimal acceptera un number
            stockQty: v.stockQty,
          })),
        },
        ...(medias && medias.length > 0
          ? {
              medias: {
                create: medias.map((m, index) => ({
                  url: m.url,
                  altText: m.altText,
                  sortOrder: m.sortOrder ?? index,
                })),
              },
            }
          : {}),
      },
      include: {
        variants: true,
        medias: true,
        category: true,
      },
    });
  }

  /**
   * GET /products
   * Lister les produits (avec pagination)
   */
  async findAll(page = 1, limit = 10) {
    const take = Math.min(limit || 10, 100); // limite max pour éviter les abus
    const skip = (page - 1) * take;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          variants: true,
          medias: true,
          category: true,
        },
      }),
      this.prisma.product.count(),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit: take,
        total,
        pageCount: Math.ceil(total / take),
      },
    };
  }

  /**
   * GET /products/:id
   * Récupérer un produit complet
   */
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        medias: true,
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product;
  }

  /**
   * PUT/PATCH /products/:id
   * Mettre à jour un produit + (optionnellement) ses variantes + médias
   *
   * Stratégie :
   * - si variants est fourni → on remplace complètement la liste
   * - si medias est fourni → on remplace complètement la liste
   * - sinon → on ne touche pas
   */
  async update(id: string, dto: UpdateProductDto) {
    const { variants, medias, categoryId, ...productData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // Vérifier que le produit existe
      const existing = await tx.product.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Product ${id} not found`);
      }

      // 1. Update des champs simples (+ catégorie si modifiée)
      await tx.product.update({
        where: { id },
        data: {
          ...productData,
          ...(categoryId && {
            category: {
              connect: { id: categoryId },
            },
          }),
        },
      });

      // 2. Variantes : si fournis → remplace complètement
      if (variants) {
        await tx.variant.deleteMany({
          where: { productId: id },
        });

        if (variants.length > 0) {
          await tx.variant.createMany({
            data: variants.map((v) => ({
              sku: v.sku,
              attributes: v.attributes,
              price: v.price,
              stockQty: v.stockQty,
              productId: id,
            })),
          });
        }
      }

      // 3. Médias : si fournis → remplace complètement
      if (medias) {
        await tx.media.deleteMany({
          where: { productId: id },
        });

        if (medias.length > 0) {
          await tx.media.createMany({
            data: medias.map((m, index) => ({
              url: m.url,
              altText: m.altText,
              sortOrder: m.sortOrder ?? index,
              productId: id,
            })),
          });
        }
      }

      // 4. Retourner le produit complet à jour
      return tx.product.findUnique({
        where: { id },
        include: {
          variants: true,
          medias: true,
          category: true,
        },
      });
    });
  }

  /**
   * DELETE /products/:id
   * Supprime le produit + ses variantes + ses médias
   */
  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.media.deleteMany({
        where: { productId: id },
      });

      await tx.variant.deleteMany({
        where: { productId: id },
      });

      return tx.product.delete({
        where: { id },
      });
    });
  }
}
