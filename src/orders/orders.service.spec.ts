import { NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma.service';

const makeOrder = (id: string, status: OrderStatus = OrderStatus.PENDING) => ({
  id,
  subtotal: 10,
  tax: 2,
  shipping: 3,
  total: 15,
  status,
  items: [
    {
      orderId: id,
      productId: 'p1',
      productName: 'prod1',
      quantity: 1,
      unitPrice: 10,
      imageUrl: 'img',
    },
  ],
  customer: {
    id: 'c1',
    email: 'a@b.c',
    orders: [{ total: 15 }],
    _count: { orders: 1 },
  },
});

describe('OrdersService', () => {
  let service: OrdersService;
  const prisma = {
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orderItem: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(async (arg) =>
      typeof arg === 'function'
        ? arg(prisma as any)
        : Promise.all(arg),
    ),
  } satisfies {
    order: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    orderItem: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrdersService(prisma as unknown as PrismaService);
  });

  it('creates an order with mapped numbers', async () => {
    prisma.order.create.mockResolvedValue(makeOrder('o1') as any);

    const result = await service.create({
      orderNumber: 'ORD-1',
      customerId: 'c1',
      subtotal: 10,
      tax: 2,
      shipping: 3,
      total: 15,
      items: [
        {
          productId: 'p1',
          productName: 'prod1',
          quantity: 1,
          unitPrice: 10,
          imageUrl: 'img',
        },
      ],
      shippingAddress: {
        street: '123 Rue',
        city: 'Paris',
        state: 'IDF',
        postalCode: '75001',
        country: 'France',
      },
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
    });

    expect(prisma.order.create).toHaveBeenCalled();
    expect(result.total).toBe(15);
    expect(result.items[0].unitPrice).toBe(10);
    expect(result.customer.totalSpent).toBe(15);
  });

  it('lists orders mapped', async () => {
    prisma.order.findMany.mockResolvedValue([makeOrder('o1')] as any);
    prisma.order.count.mockResolvedValue(1 as any);

    const result = await service.findAll();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].customer.ordersCount).toBe(1);
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, pageCount: 1 });
  });

  it('finds one order or throws', async () => {
    prisma.order.findUnique
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(makeOrder('o2') as any);
    prisma.order.count.mockResolvedValue(1 as any);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const found = await service.findOne('o2');
    expect(found.id).toBe('o2');
  });

  it('updates an order and replaces items when provided', async () => {
    prisma.order.findUnique
      .mockResolvedValueOnce(makeOrder('o3') as any)
      .mockResolvedValueOnce(makeOrder('o3', OrderStatus.SHIPPED) as any);
    prisma.order.update.mockResolvedValue(
      makeOrder('o3', OrderStatus.SHIPPED) as any,
    );

    const result = await service.update('o3', {
      status: OrderStatus.SHIPPED,
      items: [
        {
          productId: 'p1',
          productName: 'prod1',
          quantity: 2,
          unitPrice: 5,
          imageUrl: 'img',
        },
      ],
    });

    expect(prisma.orderItem.deleteMany).toHaveBeenCalledWith({
      where: { orderId: 'o3' },
    });
    expect(prisma.orderItem.createMany).toHaveBeenCalled();
    expect(result.status).toBe(OrderStatus.SHIPPED);
  });

  it('throws on update when order not found', async () => {
    prisma.order.findUnique.mockResolvedValue(null as any);

    await expect(
      service.update('missing', { paymentStatus: PaymentStatus.PAID }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes an order by id', async () => {
    prisma.order.delete.mockResolvedValue({ id: 'o4' } as any);

    await service.remove('o4');
    expect(prisma.order.delete).toHaveBeenCalledWith({ where: { id: 'o4' } });
  });
});
