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
import { CustomersModule } from './customers/customers.module';
import { OrdersModule } from './orders/orders.module';
import { PagesModule } from './pages/pages.module';
import { CartModule } from './cart/cart.module';
import { SettingsModule } from './settings/settings.module';
import { ThemeModule } from './theme/theme.module';

@Module({
  imports: [
    ProductsModule,
    CategoriesModule,
    AuthModule,
    PromotionsModule,
    AuditModule,
    MetricsModule,
    PrismaModule,
    UsersModule,
    CustomersModule,
    OrdersModule,
    PagesModule,
    CartModule,
    SettingsModule,
    ThemeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
