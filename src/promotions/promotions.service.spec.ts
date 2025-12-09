import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsService } from './promotions.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

describe('PromotionsService', () => {
  const prisma = {
    promotion: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    productPromotion: {
      createMany: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;

  const auditMock = {
    logAction: jest.fn(),
  } as unknown as jest.Mocked<AuditService>;

  let service: PromotionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  it('rejects end date before start date', async () => {
    await expect(
      service.create({ startDate: '2024-02-02', endDate: '2024-02-01' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates and lists promotions', async () => {
    prisma.promotion.create.mockResolvedValue({ id: 'p1' } as any);
    prisma.promotion.findMany.mockResolvedValue(['p'] as any);

    await expect(
      service.create({
        startDate: '2024-02-01',
        endDate: '2024-02-02',
        name: 'Promo',
      } as any),
    ).resolves.toEqual({ id: 'p1' });

    await expect(service.findAll()).resolves.toEqual(['p']);
    expect(prisma.promotion.create).toHaveBeenCalled();
    expect(prisma.promotion.findMany).toHaveBeenCalledWith({
      orderBy: { startDate: 'desc' },
    });
  });

  it('assigns products to a promotion and validates inputs', async () => {
    prisma.promotion.findUnique.mockResolvedValue(null as any);
    await expect(
      service.assignProductsToPromotion('pid', { productIds: ['a'] }),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.promotion.findUnique.mockResolvedValue({ id: 'pid' } as any);
    await expect(
      service.assignProductsToPromotion('pid', { productIds: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.productPromotion.createMany.mockResolvedValue({ count: 2 } as any);
    await expect(
      service.assignProductsToPromotion('pid', { productIds: ['a', 'b'] }),
    ).resolves.toEqual({ promotionId: 'pid', linkedCount: 2 });
    expect(prisma.productPromotion.createMany).toHaveBeenCalledWith({
      data: [
        { productId: 'a', promotionId: 'pid' },
        { productId: 'b', promotionId: 'pid' },
      ],
      skipDuplicates: true,
    });
  });

  it('updates and removes promotions', async () => {
    prisma.promotion.update.mockResolvedValue({ id: 'pid', name: 'u' } as any);
    prisma.promotion.delete.mockResolvedValue({ id: 'pid' } as any);

    await expect(service.update('pid', { name: 'u' } as any)).resolves.toEqual({
      id: 'pid',
      name: 'u',
    });
    await expect(service.remove('pid')).resolves.toEqual({ id: 'pid' });
  });
});
