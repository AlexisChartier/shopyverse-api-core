import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { describe, beforeEach, it } from 'node:test';

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service);
  });
});
function expect(service: CategoriesService) {
  throw new Error('Function not implemented.');
}
