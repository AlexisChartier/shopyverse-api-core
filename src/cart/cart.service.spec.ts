import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma.service';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'uuid-1'),
}));

describe('CartService', () => {
  const now = new Date('2024-01-01T00:00:00Z');
  let service: CartService;
  let prisma: jest.Mocked<PrismaService> & {
    cartSession: any;
    cartItem: any;
    $transaction: any;
  };

  beforeEach(() => {
    prisma = {
      cartSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      cartItem: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma as any)),
    } as any;

    service = new CartService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a cart session with default currency and maps the response', async () => {
    prisma.cartSession.create.mockResolvedValue({
      id: 'c1',
      sessionId: 'uuid-1',
      currency: 'EUR',
      updatedAt: now,
      items: [],
    });

    const result = await service.createSession({ currency: undefined });

    expect(prisma.cartSession.create).toHaveBeenCalledWith({
      data: { sessionId: 'uuid-1', currency: 'EUR' },
      include: { items: true },
    });
    expect(result).toEqual({
      id: 'c1',
      sessionId: 'uuid-1',
      currency: 'EUR',
      updatedAt: now,
      items: [],
      subtotal: 0,
    });
  });

  it('finds a cart by session id or throws when missing', async () => {
    prisma.cartSession.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'c1',
        sessionId: 's1',
        currency: 'EUR',
        updatedAt: now,
        items: [{ productId: 'p1', quantity: 2 }],
      });

    await expect(service.findBySessionId('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const result = await service.findBySessionId('s1');
    expect(result.items).toEqual([{ productId: 'p1', quantity: 2 }]);
  });

  it('replaces items, normalizes duplicates, and returns the updated cart', async () => {
    prisma.cartSession.findUnique
      .mockResolvedValueOnce({ id: 'c1' })
      .mockResolvedValueOnce({
        id: 'c1',
        sessionId: 's1',
        currency: 'EUR',
        updatedAt: now,
        items: [
          { productId: 'p1', quantity: 3 },
          { productId: 'p2', quantity: 1 },
        ],
      });

    const result = await service.replaceItems('s1', {
      items: [
        { productId: 'p1', quantity: 1 },
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', quantity: 1 },
      ],
    });

    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: 'c1' },
    });
    expect(prisma.cartItem.createMany).toHaveBeenCalledWith({
      data: [
        { cartId: 'c1', productId: 'p1', quantity: 3 },
        { cartId: 'c1', productId: 'p2', quantity: 1 },
      ],
    });
    expect(result.items).toEqual([
      { productId: 'p1', quantity: 3 },
      { productId: 'p2', quantity: 1 },
    ]);
  });

  it('throws when replacing items if cart not found', async () => {
    prisma.cartSession.findUnique.mockResolvedValue(null);

    await expect(
      service.replaceItems('missing', { items: [] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when items payload is missing', async () => {
    prisma.cartSession.findUnique.mockResolvedValue({ id: 'c1' });

    await expect(
      // @ts-expect-error intentional bad payload
      service.replaceItems('s1', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('clears a cart or throws if not found', async () => {
    prisma.cartSession.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'c1' });

    await expect(service.clear('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    await service.clear('s1');
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: 'c1' },
    });
  });
});
