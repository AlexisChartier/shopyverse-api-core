import { Test, TestingModule } from '@nestjs/testing';
import { ThemeController } from './theme.controller';
import { ThemeService } from './theme.service';

describe('ThemeController', () => {
  let controller: ThemeController;
  const service = {
    getTheme: jest.fn(),
    updateTheme: jest.fn(),
  } as unknown as jest.Mocked<ThemeService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThemeController],
      providers: [{ provide: ThemeService, useValue: service }],
    }).compile();

    controller = module.get<ThemeController>(ThemeController);
  });

  it('delegates theme reads and updates', async () => {
    service.getTheme.mockResolvedValue('theme' as any);
    service.updateTheme.mockResolvedValue('updated' as any);

    expect(await controller.findOne()).toBe('theme');
    expect(await controller.update({} as any)).toBe('updated');
    expect(service.updateTheme).toHaveBeenCalled();
  });
});
