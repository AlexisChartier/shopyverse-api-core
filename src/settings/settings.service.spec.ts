import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma.service';

describe('SettingsService', () => {
  const prisma = {
    storeSetting: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  } satisfies {
    storeSetting: {
      findUnique: jest.Mock;
      create: jest.Mock;
      upsert: jest.Mock;
    };
  };

  let service: SettingsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('returns existing settings or creates defaults', async () => {
    prisma.storeSetting.findUnique.mockResolvedValue({ id: 'default' } as any);
    await expect(service.getSettings()).resolves.toEqual({ id: 'default' });

    prisma.storeSetting.findUnique.mockResolvedValue(null as any);
    prisma.storeSetting.create.mockResolvedValue({ id: 'default' } as any);
    await expect(service.getSettings()).resolves.toEqual({ id: 'default' });
  });

  it('updates settings and filters empty payment methods', async () => {
    prisma.storeSetting.upsert.mockResolvedValue({ id: 'default' } as any);

    await expect(
      service.updateSettings({
        currency: 'USD',
        allowedPaymentMethods: ['card', ''],
        emailNotifications: false,
      } as any),
    ).resolves.toEqual({ id: 'default' });

    expect(prisma.storeSetting.upsert).toHaveBeenCalledWith({
      where: { id: 'default' },
      create: {
        id: 'default',
        currency: 'USD',
        taxRate: 20,
        shippingRate: 0,
        allowedPaymentMethods: ['card', ''],
        emailNotifications: false,
        orderPrefix: 'ORD',
      },
      update: {
        currency: 'USD',
        allowedPaymentMethods: ['card'],
        emailNotifications: false,
      },
    });
  });
});
