import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { describe, beforeEach, it } from 'node:test';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service);
  });
});
function expect(service: ProductsService) {
  throw new Error('Function not implemented.');
}
