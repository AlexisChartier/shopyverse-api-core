import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsService } from './promotions.service';
import { describe, beforeEach, it } from 'node:test';

describe('PromotionsService', () => {
  let service: PromotionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromotionsService],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  it('should be defined', () => {
    expect(service);
  });
});
function expect(service: PromotionsService) {
  throw new Error('Function not implemented.');
}
