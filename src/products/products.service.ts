import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditService } from '../audit/audit.service';
import { ImportStockDto } from './dto/import-stock.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * POST /products
   * Créer un produit avec variantes + médias
   */
  async create(dto: CreateProductDto, userId?: string) {
    const { variants, medias, categoryId, ...productData } = dto;

    const created = await this.prisma.product.create({
      data: {
        ...productData, // title, description, slug, isPublished, meta...
        category: {
          connect: { id: categoryId },
        },
        variants: {
          create: variants.map((v) => ({
            sku: v.sku,
            attributes: v.attributes,
            price: v.price, // Prisma Decimal acceptera un number
            stockQty: v.stockQty,
            alertThreshold: v.alertThreshold ?? undefined,
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

    if (userId) {
      await this.auditService.log('product.create', userId, {
        productId: created.id,
        slug: created.slug,
      });
    }

    return created;
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
  async update(id: string, dto: UpdateProductDto, userId?: string) {
    const { variants, medias, categoryId, ...productData } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
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
              alertThreshold: v.alertThreshold ?? undefined,
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

    if (userId) {
      await this.auditService.log('product.update', userId, {
        productId: id,
      });
    }

    return updated;
  }

  /**
   * POST /products/stock/import
   * Importer des stocks via JSON ou CSV (sku, stockQty, alertThreshold)
   */
  async importStock(dto: ImportStockDto, userId?: string) {
    const rows: { sku: string; stockQty: number; alertThreshold?: number }[] =
      [];

    if (dto.items && dto.items.length > 0) {
      rows.push(...dto.items);
    }

    if (dto.csv) {
      const lines = dto.csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
      // skip header if present
      const startIndex = lines[0].toLowerCase().includes('sku') ? 1 : 0;
      for (let i = startIndex; i < lines.length; i += 1) {
        const [sku, stock, alert] = lines[i].split(',').map((s) => s.trim());
        if (!sku) continue;
        const stockQty = Number(stock ?? '');
        const alertThreshold =
          alert !== undefined && alert.length > 0 ? Number(alert) : undefined;
        if (Number.isNaN(stockQty) || stockQty < 0) continue;
        rows.push({ sku, stockQty, alertThreshold });
      }
    }

    if (rows.length === 0) {
      return { updated: 0 };
    }

    let updatedCount = 0;
    await this.prisma.$transaction(async (tx) => {
      for (const row of rows) {
        const updated = await tx.variant.updateMany({
          where: { sku: row.sku },
          data: {
            stockQty: row.stockQty,
            ...(row.alertThreshold !== undefined
              ? { alertThreshold: row.alertThreshold }
              : {}),
          },
        });
        updatedCount += updated.count;
      }
    });

    if (userId) {
      await this.auditService.log('stock.import', userId, {
        updated: updatedCount,
      });
    }

    return { updated: updatedCount };
  }

  /**
   * GET /products/stock/low
   * Retourne les variantes dont le stock est inférieur ou égal au seuil (alertThreshold ou 5 par défaut)
   */
  async listLowStock() {
    // Fetch candidates with a generous cap, filter in memory using alertThreshold or default 5
    const variants = await this.prisma.variant.findMany({
      where: {
        stockQty: { lte: 20 },
      },
      include: {
        product: true,
      },
    });

    const low = variants.filter((v) => v.stockQty <= (v.alertThreshold ?? 5));
    return low.map((v) => ({
      variantId: v.id,
      sku: v.sku,
      stockQty: v.stockQty,
      alertThreshold: v.alertThreshold ?? 5,
      product: {
        id: v.product.id,
        title: v.product.title,
        slug: v.product.slug,
        categoryId: v.product.categoryId,
      },
    }));
  }

  /**
   * DELETE /products/:id
   * Supprime le produit + ses variantes + ses médias
   */
  async remove(id: string, userId?: string) {
    const deleted = await this.prisma.$transaction(async (tx) => {
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

    if (userId) {
      await this.auditService.log('product.delete', userId, {
        productId: id,
      });
    }

    return deleted;
  }
}
