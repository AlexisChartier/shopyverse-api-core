import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ProductsService', () => {
  const prisma = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    variant: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    media: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as jest.Mocked<PrismaService>;

  const auditMock = {
    logAction: jest.fn(),
  } as unknown as jest.Mocked<AuditService>;

  let service: ProductsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('creates a product with relations', async () => {
    prisma.product.create.mockResolvedValue({ id: 'p1' } as any);

    await expect(
      service.create({
        title: 't',
        categoryId: 'c1',
        variants: [
          {
            sku: 'sku',
            attributes: {},
            price: 10,
            stockQty: 1,
          },
        ],
        medias: [{ url: 'u', altText: 'a', sortOrder: 0 }],
      } as any),
    ).resolves.toEqual({ id: 'p1' });

    expect(prisma.product.create).toHaveBeenCalled();
  });

  it('paginates products', async () => {
    prisma.$transaction.mockResolvedValueOnce([[{ id: 'p' }], 2] as any);

    await expect(service.findAll(2, 5)).resolves.toEqual({
      data: [{ id: 'p' }],
      meta: { page: 2, limit: 5, total: 2, pageCount: 1 },
    });

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('finds or throws on missing product', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'p' } as any);
    await expect(service.findOne('p')).resolves.toEqual({ id: 'p' });

    prisma.product.findUnique.mockResolvedValue(null as any);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates a product with variants and medias', async () => {
    const tx = {
      product: {
        findUnique: jest.fn().mockResolvedValue({ id: 'p' }),
        update: jest.fn().mockResolvedValue(undefined),
        findUnique: jest.fn().mockResolvedValue({ id: 'p', title: 'updated' }),
      },
      variant: {
        deleteMany: jest.fn().mockResolvedValue(undefined),
        createMany: jest.fn().mockResolvedValue(undefined),
      },
      media: {
        deleteMany: jest.fn().mockResolvedValue(undefined),
        createMany: jest.fn().mockResolvedValue(undefined),
      },
    } as any;

    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await expect(
      service.update('p', {
        title: 'new',
        variants: [{ sku: 's', attributes: {}, price: 1, stockQty: 1 }],
        medias: [{ url: 'u', altText: 'a', sortOrder: 0 }],
      } as any),
    ).resolves.toEqual({ id: 'p', title: 'updated' });

    expect(tx.variant.deleteMany).toHaveBeenCalled();
    expect(tx.media.deleteMany).toHaveBeenCalled();
  });

  it('throws when updating a missing product', async () => {
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb({ product: { findUnique: jest.fn().mockResolvedValue(null) } } as any),
    );

    await expect(service.update('missing', {} as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('removes a product and relations', async () => {
    const tx = {
      media: { deleteMany: jest.fn().mockResolvedValue(undefined) },
      variant: { deleteMany: jest.fn().mockResolvedValue(undefined) },
      product: { delete: jest.fn().mockResolvedValue({ id: 'p' }) },
    } as any;

    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await expect(service.remove('p')).resolves.toEqual({ id: 'p' });
    expect(tx.product.delete).toHaveBeenCalledWith({ where: { id: 'p' } });
  });
});
