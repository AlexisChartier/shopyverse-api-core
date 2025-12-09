import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [AuditModule, PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
