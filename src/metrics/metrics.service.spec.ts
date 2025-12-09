import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { PrismaService } from '../prisma.service';

describe('MetricsService', () => {
  let service: MetricsService;
  const prisma = {
    storefrontMetricEvent: {
      create: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
  } satisfies Partial<PrismaService>;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10T00:00:00Z'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('records storefront events with defaults and sanitized payload', async () => {
    prisma.storefrontMetricEvent.create.mockResolvedValue(undefined);

    await service.recordStorefrontEvent({
      name: 'cart.added',
      visitorId: 'v1',
      sessionId: 's1',
      payload: { nested: { a: 1 } },
    });

    expect(prisma.storefrontMetricEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'cart.added',
          visitorId: 'v1',
          sessionId: 's1',
          source: 'storefront',
        }),
      }),
    );

    const call = prisma.storefrontMetricEvent.create.mock.calls[0][0];
    expect(call.data.payload).toEqual({ nested: { a: 1 } });
    expect(call.data.occurredAt).toBeInstanceOf(Date);
  });

  it('builds a bounded summary with counts and timeline', async () => {
    prisma.storefrontMetricEvent.groupBy.mockResolvedValue([
      { name: 'filter.search', _count: { _all: 2 } },
      { name: 'cart.added', _count: { _all: 1 } },
      { name: 'recommendation.click', _count: { _all: 1 } },
    ]);
    prisma.storefrontMetricEvent.findMany.mockResolvedValue([
      { occurredAt: new Date('2024-01-08T12:00:00Z') },
      { occurredAt: new Date('2024-01-09T12:00:00Z') },
    ]);

    const summary = await service.getStorefrontSummary(3);

    expect(prisma.storefrontMetricEvent.groupBy).toHaveBeenCalled();
    expect(prisma.storefrontMetricEvent.findMany).toHaveBeenCalled();
    expect(summary.rangeInDays).toBe(3);
    expect(summary.totalEvents).toBe(4);
    expect(summary.filters.search).toBe(2);
    expect(summary.cart.added).toBe(1);
    expect(summary.recommendations.click).toBe(1);
    expect(summary.timeline).toHaveLength(3);
    expect(summary.timeline[0].count).toBe(1);
    expect(summary.timeline[1].count).toBe(1);
  });
});
