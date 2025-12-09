import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<OrdersService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: service }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('delegates to service for CRUD', async () => {
    const dto: any = { id: 'o1' };
    service.create.mockResolvedValue('created' as any);
    service.findAll.mockResolvedValue(['all'] as any);
    service.findOne.mockResolvedValue('one' as any);
    service.update.mockResolvedValue('updated' as any);
    service.remove.mockResolvedValue(undefined as any);

    expect(await controller.create(dto)).toBe('created');
    expect(await controller.findAll()).toEqual(['all']);
    expect(await controller.findOne('id')).toBe('one');
    expect(await controller.update('id', dto)).toBe('updated');
    await controller.remove('id');

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(service.update).toHaveBeenCalledWith('id', dto);
    expect(service.remove).toHaveBeenCalledWith('id');
  });
});
