import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<ProductsService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: service }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('delegates to service', async () => {
    service.create.mockResolvedValue('created' as any);
    service.findAll.mockResolvedValue('list' as any);
    service.findOne.mockResolvedValue('one' as any);
    service.update.mockResolvedValue('updated' as any);
    service.remove.mockResolvedValue('deleted' as any);

    expect(await controller.create({} as any)).toBe('created');
    expect(await controller.findAll(1, 10)).toBe('list');
    expect(await controller.findOne('id')).toBe('one');
    expect(await controller.update('id', {} as any)).toBe('updated');
    expect(await controller.remove('id')).toBe('deleted');
  });
});
