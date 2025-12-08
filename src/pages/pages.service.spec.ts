import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PagesService } from './pages.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

describe('PagesService', () => {
  const prisma = {
    customPage: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pageSection: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } satisfies {
    customPage: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    pageSection: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const auditMock = {
    logAction: jest.fn(),
  } satisfies {
    logAction: jest.Mock;
  };

  let service: PagesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get<PagesService>(PagesService);
  });

  it('creates pages with sections and maps them', async () => {
    prisma.customPage.create.mockResolvedValue({
      id: 'p1',
      sections: [
        {
          id: 's1',
          type: 'text',
          content: 'c',
          level: null,
          productId: null,
          productIds: null,
          imageUrl: null,
          height: null,
          sortOrder: 0,
        },
      ],
    } as any);

    await expect(
      service.create({
        name: 'n',
        slug: 's',
        sections: [{ type: 'text', content: 'c' } as any],
      } as any),
    ).resolves.toEqual({
      id: 'p1',
      sections: [
        {
          id: 's1',
          type: 'text',
          content: 'c',
          level: null,
          productId: null,
          productIds: undefined,
          imageUrl: null,
          height: null,
          order: 0,
          sortOrder: 0,
        },
      ],
    });
  });

  it('lists and finds pages or throws', async () => {
    prisma.customPage.findMany.mockResolvedValue([
      { id: 'p1', sections: [], sortOrder: 0 },
    ] as any);
    await expect(service.findAll()).resolves.toEqual([
      { id: 'p1', sections: [], sortOrder: 0 },
    ]);

    prisma.customPage.findUnique.mockResolvedValue(null as any);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.customPage.findUnique.mockResolvedValue({
      id: 'p2',
      sections: [],
    } as any);
    await expect(service.findOne('p2')).resolves.toEqual({
      id: 'p2',
      sections: [],
    });

    prisma.customPage.findUnique.mockResolvedValue({
      id: 'slug',
      sections: [],
    } as any);
    await expect(service.findBySlug('slug')).resolves.toEqual({
      id: 'slug',
      sections: [],
    });
  });

  it('updates pages and replaces sections', async () => {
    prisma.customPage.findUnique
      .mockResolvedValueOnce({ id: 'p1' } as any) // exists check
      .mockResolvedValueOnce({
        id: 'p1',
        sections: [
          {
            id: 's1',
            type: 'text',
            content: 'after',
            level: null,
            productId: null,
            productIds: null,
            imageUrl: null,
            height: null,
            sortOrder: 0,
          },
        ],
      } as any); // final fetch

    prisma.customPage.update.mockResolvedValue({} as any);
    prisma.pageSection.deleteMany.mockResolvedValue({} as any);
    prisma.pageSection.createMany.mockResolvedValue({ count: 1 } as any);

    await expect(
      service.update('p1', {
        sections: [{ type: 'text', content: 'after' } as any],
      } as any),
    ).resolves.toEqual({
      id: 'p1',
      sections: [
        {
          id: 's1',
          type: 'text',
          content: 'after',
          level: null,
          productId: null,
          productIds: undefined,
          imageUrl: null,
          height: null,
          order: 0,
          sortOrder: 0,
        },
      ],
    });

    expect(prisma.pageSection.deleteMany).toHaveBeenCalledWith({
      where: { pageId: 'p1' },
    });
    expect(prisma.pageSection.createMany).toHaveBeenCalled();
  });

  it('throws when updating or removing missing pages', async () => {
    prisma.customPage.findUnique.mockResolvedValue(null as any);
    await expect(service.update('missing', {} as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.customPage.findUnique.mockResolvedValue(null as any);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('removes pages with sections transactionally', async () => {
    prisma.customPage.findUnique.mockResolvedValue({ id: 'p1' } as any);
    prisma.$transaction.mockResolvedValueOnce([{}, {}] as any);

    await expect(service.remove('p1')).resolves.toEqual({ deleted: true });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
