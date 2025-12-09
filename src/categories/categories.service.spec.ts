import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma.service';

describe('CategoriesService', () => {
  const prisma = {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;

  let service: CategoriesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('creates a category', async () => {
    prisma.category.create.mockResolvedValue({ id: '1' } as any);
    await expect(service.create({ name: 'Cat' } as any)).resolves.toEqual({
      id: '1',
    });
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { name: 'Cat' },
    });
  });

  it('lists categories with children and counts', async () => {
    prisma.category.findMany.mockResolvedValue(['root'] as any);
    await expect(service.findAll()).resolves.toEqual(['root']);
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { parentId: null },
      include: {
        children: { include: { _count: { select: { products: true } } } },
        _count: { select: { products: true } },
      },
    });
  });

  it('lists categories flat', async () => {
    prisma.category.findMany.mockResolvedValue(['flat'] as any);
    await expect(service.findAllFlat()).resolves.toEqual(['flat']);
    expect(prisma.category.findMany).toHaveBeenCalledWith();
  });

  it('returns a category or throws when missing', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: '1' } as any);
    await expect(service.findOne('1')).resolves.toEqual({ id: '1' });
    prisma.category.findUnique.mockResolvedValue(null as any);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates and removes categories', async () => {
    prisma.category.update.mockResolvedValue({
      id: '1',
      name: 'updated',
    } as any);
    prisma.category.delete.mockResolvedValue({ id: '1' } as any);

    await expect(
      service.update('1', { name: 'updated' } as any),
    ).resolves.toEqual({
      id: '1',
      name: 'updated',
    });
    await expect(service.remove('1')).resolves.toEqual({ id: '1' });

    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { name: 'updated' },
    });
    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
