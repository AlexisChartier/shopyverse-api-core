import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // Importez votre PrismaService Global
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // Si un parentId est fourni, on pourrait vérifier s'il existe,
    // mais Prisma le fera et renverra une erreur Foreign Key si invalide.
    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll() {
    // On récupère les catégories "racines" (sans parent) avec leurs enfants directs
    // Pour une hiérarchie infinie, il faudrait une méthode récursive ou une structure 'closure table',
    // mais pour ce TP, 1 niveau de profondeur suffit souvent.
    return this.prisma.category.findMany({
      where: { parentId: null }, // Seulement les racines
      include: {
        children: {
          include: { _count: { select: { products: true } } }, // Bonus : on compte les produits
        },
        _count: { select: { products: true } },
      },
    });
  }

  // Endpoint utile pour avoir la liste plate (pour les selects dans le Back-Office)
  async findAllFlat() {
    return this.prisma.category.findMany();
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true, // On voit les sous-catégories
        parent: true, // On voit le parent
      },
    });

    if (!category) throw new NotFoundException(`Catégorie #${id} introuvable`);
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string) {
    // Attention : Si la catégorie a des produits, Prisma bloquera la suppression (Foreign Key).
    // Il faudrait soit supprimer les produits, soit les désassigner.
    // Pour l'instant, on laisse l'erreur Prisma remonter si elle est utilisée.
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
