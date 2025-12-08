import { Test, TestingModule } from '@nestjs/testing';
import { ThemeService } from './theme.service';
import { PrismaService } from '../prisma.service';

describe('ThemeService', () => {
  const prisma = {
    themeSetting: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  } satisfies {
    themeSetting: {
      findUnique: jest.Mock;
      create: jest.Mock;
      upsert: jest.Mock;
    };
  };

  let service: ThemeService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThemeService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ThemeService>(ThemeService);
  });

  it('returns existing theme or creates default', async () => {
    prisma.themeSetting.findUnique.mockResolvedValue({ id: 'default' } as any);
    await expect(service.getTheme()).resolves.toEqual({ id: 'default' });

    prisma.themeSetting.findUnique.mockResolvedValue(null as any);
    prisma.themeSetting.create.mockResolvedValue({ id: 'default' } as any);
    await expect(service.getTheme()).resolves.toEqual({ id: 'default' });
  });

  it('updates theme settings', async () => {
    prisma.themeSetting.upsert.mockResolvedValue({ id: 'default' } as any);

    await expect(
      service.updateTheme({ primaryColor: '#000', footerText: 'ft' } as any),
    ).resolves.toEqual({ id: 'default' });

    expect(prisma.themeSetting.upsert).toHaveBeenCalledWith({
      where: { id: 'default' },
      create: {
        id: 'default',
        primaryColor: '#000',
        secondaryColor: '#6366f1',
        accentColor: '#f59e0b',
        fontFamily: 'Inter',
        logo: undefined,
        storeName: 'Ma Boutique',
        storeDescription: 'Découvrez nos produits de qualité supérieure',
        headerLayout: 'centered',
        footerText: 'ft',
      },
      update: {
        primaryColor: '#000',
        footerText: 'ft',
      },
    });
  });
});
