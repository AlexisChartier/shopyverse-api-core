import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { CreateSectionDto } from './dto/create-section.dto';

const defaultInclude = {
  sections: {
    orderBy: {
      sortOrder: 'asc' as const,
    },
  },
} as const;

type PageWithSections = Prisma.CustomPageGetPayload<{
  include: typeof defaultInclude;
}>;

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePageDto) {
    const page = await this.prisma.customPage.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        theme: dto.theme,
        isPublished: dto.isPublished ?? false,
        isInMenu: dto.isInMenu ?? false,
        sections: dto.sections?.length
          ? {
              create: dto.sections.map((section, index) =>
                this.mapSectionForNestedCreate(section, index),
              ),
            }
          : undefined,
      },
      include: defaultInclude,
    });

    return this.mapPage(page);
  }

  async findAll() {
    const pages = await this.prisma.customPage.findMany({
      orderBy: { createdAt: 'desc' },
      include: defaultInclude,
    });

    return pages.map((page) => this.mapPage(page));
  }

  async findOne(id: string) {
    const page = await this.prisma.customPage.findUnique({
      where: { id },
      include: defaultInclude,
    });

    if (!page) {
      throw new NotFoundException(`Custom page ${id} not found`);
    }

    return this.mapPage(page);
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.customPage.findUnique({
      where: { slug },
      include: defaultInclude,
    });

    if (!page) {
      throw new NotFoundException(`Custom page ${slug} not found`);
    }

    return this.mapPage(page);
  }

  async update(id: string, dto: UpdatePageDto) {
    const exists = await this.prisma.customPage.findUnique({ where: { id } });

    if (!exists) {
      throw new NotFoundException(`Custom page ${id} not found`);
    }

    await this.prisma.customPage.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        theme: dto.theme,
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
        ...(dto.isInMenu !== undefined && { isInMenu: dto.isInMenu }),
      },
    });

    if (dto.sections) {
      await this.prisma.pageSection.deleteMany({ where: { pageId: id } });

      if (dto.sections.length) {
        const sectionsData = dto.sections.map((section, index) =>
          this.mapSectionForStandaloneCreate(section, index, id),
        );

        await this.prisma.pageSection.createMany({ data: sectionsData });
      }
    }

    const updated = await this.prisma.customPage.findUnique({
      where: { id },
      include: defaultInclude,
    });

    return this.mapPage(updated as PageWithSections);
  }

  async remove(id: string) {
    const page = await this.prisma.customPage.findUnique({ where: { id } });

    if (!page) {
      throw new NotFoundException(`Custom page ${id} not found`);
    }

    await this.prisma.$transaction([
      this.prisma.pageSection.deleteMany({ where: { pageId: id } }),
      this.prisma.customPage.delete({ where: { id } }),
    ]);

    return { deleted: true };
  }

  private mapSectionForNestedCreate(section: CreateSectionDto, index: number) {
    return {
      type: section.type,
      content: section.content,
      level: section.level,
      productId: section.productId,
      productIds: section.productIds
        ? (section.productIds as unknown as Prisma.InputJsonValue)
        : undefined,
      imageUrl: section.imageUrl,
      height: section.height,
      sortOrder: section.sortOrder ?? index,
    };
  }

  private mapSectionForStandaloneCreate(
    section: CreateSectionDto,
    index: number,
    pageId: string,
  ) {
    return {
      pageId,
      ...this.mapSectionForNestedCreate(section, index),
    };
  }

  private mapPage(page: PageWithSections) {
    return {
      ...page,
      sections: page.sections.map((section) => ({
        id: section.id,
        type: section.type,
        content: section.content,
        level: section.level,
        productId: section.productId,
        productIds: this.parseProductIds(section.productIds),
        imageUrl: section.imageUrl,
        height: section.height,
        order: section.sortOrder,
        sortOrder: section.sortOrder,
      })),
    };
  }

  private parseProductIds(productIds: Prisma.JsonValue | null) {
    if (Array.isArray(productIds)) {
    return productIds.map((value) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
      }
      return JSON.stringify(value);
    });
    }
    return undefined;
  }
}