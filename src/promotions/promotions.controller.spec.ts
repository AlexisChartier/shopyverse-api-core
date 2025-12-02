import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { PrismaService } from '../prisma.service';

describe('PromotionsController', () => {
  let controller: PromotionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromotionsController],
      providers: [
        PromotionsService,
        {
          provide: PrismaService,
          useValue: {}, // Mock de Prisma
        },
      ],
    }).compile();

    controller = module.get<PromotionsController>(PromotionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
