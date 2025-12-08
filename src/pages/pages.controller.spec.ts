import { Test, TestingModule } from '@nestjs/testing';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';

describe('PagesController', () => {
  let controller: PagesController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findBySlug: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<PagesService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagesController],
      providers: [{ provide: PagesService, useValue: service }],
    }).compile();

    controller = module.get<PagesController>(PagesController);
  });

  it('delegates to service', async () => {
    service.create.mockResolvedValue('created' as any);
    service.findAll.mockResolvedValue('all' as any);
    service.findBySlug.mockResolvedValue('by-slug' as any);
    service.findOne.mockResolvedValue('one' as any);
    service.update.mockResolvedValue('updated' as any);
    service.remove.mockResolvedValue('deleted' as any);

    expect(await controller.create({} as any)).toBe('created');
    expect(await controller.findAll()).toBe('all');
    expect(await controller.findBySlug('slug')).toBe('by-slug');
    expect(await controller.findOne('id')).toBe('one');
    expect(await controller.update('id', {} as any)).toBe('updated');
    expect(await controller.remove('id')).toBe('deleted');
  });
});
