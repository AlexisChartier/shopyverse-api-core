import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const prismaMock = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    variant: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    media: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(prismaMock)),
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Exemple de petit test sur create (optionnel)
  it('should call prisma.product.create on create', async () => {
    prismaMock.product.create = jest.fn().mockResolvedValue({ id: 'p1' });

    await service.create({
      title: 'Test',
      description: 'Desc',
      slug: 'test-slug',
      isPublished: true,
      categoryId: 'cat-1',
      variants: [
        {
          sku: 'SKU-1',
          attributes: { size: 'L' },
          price: 10,
          stockQty: 5,
        },
      ],
      medias: [],
    });

    expect(prismaMock.product.create).toHaveBeenCalled();
  });
});
