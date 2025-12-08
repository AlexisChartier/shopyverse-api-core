import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

describe('PromotionsController', () => {
  let controller: PromotionsController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    assignProductsToPromotion: jest.fn(),
  } as unknown as jest.Mocked<PromotionsService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromotionsController],
      providers: [{ provide: PromotionsService, useValue: service }],
    }).compile();

    controller = module.get<PromotionsController>(PromotionsController);
  });

  it('delegates to service', async () => {
    service.create.mockResolvedValue('created' as any);
    service.findAll.mockResolvedValue('all' as any);
    service.findOne.mockResolvedValue('one' as any);
    service.update.mockResolvedValue('updated' as any);
    service.remove.mockResolvedValue('deleted' as any);
    service.assignProductsToPromotion.mockResolvedValue('assigned' as any);

    expect(await controller.create({} as any)).toBe('created');
    expect(await controller.findAll()).toBe('all');
    expect(await controller.findOne('id')).toBe('one');
    expect(await controller.update('id', {} as any)).toBe('updated');
    expect(await controller.remove('id')).toBe('deleted');
    expect(
      await controller.assignProducts('id', { productIds: [] } as any),
    ).toBe('assigned');
  });
});
