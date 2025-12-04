import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [HttpModule],
  controllers: [ProductsController],
  providers: [ProductsService, RecommendationsService],
})
export class ProductsModule {}
