import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

const service = {
  create: jest.fn(),
  findAll: jest.fn(),
  findAllFlat: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
} as unknown as jest.Mocked<CategoriesService>;

describe('CategoriesController', () => {
  let controller: CategoriesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: service }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('delegates to service', async () => {
    service.create.mockResolvedValue('created' as any);
    service.findAll.mockResolvedValue(['all'] as any);
    service.findAllFlat.mockResolvedValue(['flat'] as any);
    service.findOne.mockResolvedValue('one' as any);
    service.update.mockResolvedValue('updated' as any);
    service.remove.mockResolvedValue('deleted' as any);

    expect(await controller.create({} as any)).toBe('created');
    expect(await controller.findAll()).toEqual(['all']);
    expect(await controller.findAllFlat()).toEqual(['flat']);
    expect(await controller.findOne('id')).toBe('one');
    expect(await controller.update('id', {} as any)).toBe('updated');
    expect(await controller.remove('id')).toBe('deleted');
  });
});
