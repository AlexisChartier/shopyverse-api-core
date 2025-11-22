import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { beforeEach, describe, it } from 'node:test';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service);
  });
});
function expect(service: AuditService) {
  throw new Error('Function not implemented.');
}
