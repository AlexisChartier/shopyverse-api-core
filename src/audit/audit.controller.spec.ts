import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma.service';

describe('AuditController', () => {
  let controller: AuditController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        AuditService,
        // On fournit le mock de Prisma car le Service en a besoin
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
