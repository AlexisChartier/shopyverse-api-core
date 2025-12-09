import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

describe('CustomersController', () => {
  let controller: CustomersController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } satisfies {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [{ provide: CustomersService, useValue: service }],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
  });

  it('delegates to service', async () => {
    service.create.mockResolvedValue('created' as any);
    service.findAll.mockResolvedValue('all' as any);
    service.findOne.mockResolvedValue('one' as any);
    service.update.mockResolvedValue('updated' as any);
    service.remove.mockResolvedValue('deleted' as any);

    expect(await controller.create({} as any)).toBe('created');
    expect(await controller.findAll(1, 50)).toBe('all');
    expect(await controller.findOne('id')).toBe('one');
    expect(await controller.update('id', {} as any)).toBe('updated');
    expect(await controller.remove('id')).toBe('deleted');
  });
});
