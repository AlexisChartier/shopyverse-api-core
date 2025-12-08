import { Module } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [AuditModule, PrismaModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
