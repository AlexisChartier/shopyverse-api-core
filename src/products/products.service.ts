import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    // Vérification unicité du slug
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug: createProductDto.slug },
    });
    if (existingProduct) throw new ConflictException('Ce slug existe déjà');

    // Création avec relations imbriquées
    const { variants, medias, ...productData } = createProductDto;

    return this.prisma.product.create({
      data: {
        ...productData,
        variants: {
          create: variants, // Prisma crée les variantes automatiquement
        },
        medias: {
          create: medias || [],
        },
      },
      include: { variants: true, medias: true, category: true }, // On renvoie l'objet complet
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        include: {
          category: true,
          medias: { take: 1 }, // Juste l'image principale pour la liste
          // On charge pas les variantes ici pour alléger, sauf si besoin du prix min/max
        },
      }),
      this.prisma.product.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        medias: true,
        category: true,
      },
    });

    if (!product) throw new NotFoundException(`Produit #${id} non trouvé`);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // Gestion complexe : Update partiel, ajout/suppression de variantes...
    // Pour ce MVP, on met à jour les champs simples du produit.
    // La gestion fine des variantes (ajout/suppr) se fait souvent via des endpoints dédiés ou une logique plus poussée ici.

    const { variants, medias, ...simpleData } = updateProductDto;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...simpleData,
        // Exemple simple : Si on renvoie des variantes, on pourrait tout supprimer et recréer (attention aux IDs)
        // Ou utiliser `upsert` dans une boucle. Pour l'instant, on update juste les infos produit.
      },
      include: { variants: true },
    });
  }

  async remove(id: string) {
    // Prisma gère le "Cascade Delete" si configuré dans le schema.prisma, sinon il faut supprimer les enfants avant.
    // Vérifiez votre schema.prisma : @relation(onDelete: Cascade) est recommandé pour Variants/Medias.
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
