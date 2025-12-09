import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

describe('SettingsController', () => {
  let controller: SettingsController;
  const service = {
    updateSettings: jest.fn(),
    getSettings: jest.fn(),
  } as unknown as jest.Mocked<SettingsService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [{ provide: SettingsService, useValue: service }],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
  });

  it('delegates to service', async () => {
    service.updateSettings.mockResolvedValue('updated' as any);
    service.getSettings.mockResolvedValue('all' as any);

    expect(await controller.update({} as any)).toBe('updated');
    expect(await controller.findOne()).toBe('all');
  });
});
