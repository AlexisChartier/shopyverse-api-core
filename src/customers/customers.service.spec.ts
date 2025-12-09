import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../prisma.service';

describe('CustomersService', () => {
  const prisma = {
    customer: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(async (operations) => Promise.all(operations)),
  } satisfies {
    customer: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  let service: CustomersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('creates a customer and maps stats', async () => {
    prisma.customer.create.mockResolvedValue({
      id: 'c1',
      orders: [{ total: 10 }, { total: null }],
      _count: { orders: 2 },
    } as any);

    await expect(service.create({ email: 'a@a.com' } as any)).resolves.toEqual({
      id: 'c1',
      ordersCount: 2,
      totalSpent: 10,
    });
  });

  it('lists customers and aggregates totals', async () => {
    prisma.customer.findMany.mockResolvedValue([
      { id: 'c1', orders: [{ total: 5 }], _count: { orders: 1 } },
    ] as any);
    prisma.customer.count.mockResolvedValue(1 as any);

    await expect(service.findAll()).resolves.toEqual({
      data: [{ id: 'c1', ordersCount: 1, totalSpent: 5 }],
      meta: { page: 1, limit: 50, total: 1, pageCount: 1 },
    });
  });

  it('finds one or throws', async () => {
    prisma.customer.findUnique.mockResolvedValue(null as any);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.customer.findUnique.mockResolvedValue({
      id: 'c1',
      orders: [{ total: 3 }],
      _count: { orders: 1 },
    } as any);
    prisma.customer.count.mockResolvedValue(1 as any);
    await expect(service.findOne('c1')).resolves.toEqual({
      id: 'c1',
      ordersCount: 1,
      totalSpent: 3,
    });
  });

  it('updates and removes customers', async () => {
    prisma.customer.update.mockResolvedValue({
      id: 'c1',
      orders: [],
      _count: { orders: 0 },
    } as any);
    prisma.customer.delete.mockResolvedValue({ id: 'c1' } as any);

    await expect(service.update('c1', {} as any)).resolves.toEqual({
      id: 'c1',
      ordersCount: 0,
      totalSpent: 0,
    });
    await expect(service.remove('c1')).resolves.toEqual({ id: 'c1' });
  });
});
