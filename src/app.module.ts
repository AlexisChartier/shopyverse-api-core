import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { AuthModule } from './auth/auth.module';
import { PromotionsModule } from './promotions/promotions.module';
import { AuditModule } from './audit/audit.module';
import { MetricsModule } from './metrics/metrics.module';
import { PrismaModule } from './prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ProductsModule, CategoriesModule, AuthModule, PromotionsModule, AuditModule, MetricsModule, PrismaModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
