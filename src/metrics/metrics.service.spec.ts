import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { describe, beforeEach, it } from 'node:test';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service);
  });
});
function expect(service: MetricsService) {
  throw new Error('Function not implemented.');
}
