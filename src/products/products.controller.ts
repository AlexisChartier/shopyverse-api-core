import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  Req,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ImportStockDto } from './dto/import-stock.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau produit avec variantes & médias' })
  @ApiResponse({ status: 201, description: 'Produit créé avec succès.' })
  create(@Body() createProductDto: CreateProductDto, @Req() req?: Request) {
    const userId =
      (req as (Request & { user?: { userId?: string } }) | undefined)?.user?.userId;
    return this.productsService.create(createProductDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les produits (avec pagination)' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.productsService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un produit complet par ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un produit et ses variantes/médias' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req?: Request,
  ) {
    const userId =
      (req as (Request & { user?: { userId?: string } }) | undefined)?.user?.userId;
    return this.productsService.update(id, updateProductDto, userId);
  }

  @Post('stock/import')
  @ApiOperation({
    summary: 'Importer des stocks (JSON ou CSV: sku,stockQty,alertThreshold)',
  })
  importStock(@Body() dto: ImportStockDto, @Req() req?: Request) {
    const userId =
      (req as (Request & { user?: { userId?: string } }) | undefined)?.user?.userId;
    return this.productsService.importStock(dto, userId);
  }

  @Get('stock/low')
  @ApiOperation({ summary: 'Lister les variantes en stock faible' })
  listLowStock() {
    return this.productsService.listLowStock();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un produit et ses ressources liées' })
  remove(@Param('id') id: string, @Req() req?: Request) {
    const userId =
      (req as (Request & { user?: { userId?: string } }) | undefined)?.user?.userId;
    return this.productsService.remove(id, userId);
  }
}
