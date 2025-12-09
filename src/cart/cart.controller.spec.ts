import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

const service = {
  createSession: jest.fn(),
  findBySessionId: jest.fn(),
  replaceItems: jest.fn(),
  clear: jest.fn(),
} as unknown as jest.Mocked<CartService>;

describe('CartController', () => {
  let controller: CartController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: service }],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  it('delegates to service', async () => {
    service.createSession.mockResolvedValue('created' as any);
    service.findBySessionId.mockResolvedValue('found' as any);
    service.replaceItems.mockResolvedValue('updated' as any);
    service.clear.mockResolvedValue(undefined as any);

    expect(await controller.create({ currency: 'EUR' } as any)).toBe('created');
    expect(await controller.findOne('sid')).toBe('found');
    expect(await controller.update('sid', { items: [] } as any)).toBe(
      'updated',
    );
    await controller.remove('sid');

    expect(service.createSession).toHaveBeenCalledWith({ currency: 'EUR' });
    expect(service.findBySessionId).toHaveBeenCalledWith('sid');
    expect(service.replaceItems).toHaveBeenCalledWith('sid', { items: [] });
    expect(service.clear).toHaveBeenCalledWith('sid');
  });
});
