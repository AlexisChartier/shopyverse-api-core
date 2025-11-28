import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { AssignProductsToPromotionDto } from './dto/assign-products.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Promotions')
@ApiBearerAuth() // Indique que tout le contrôleur est sécurisé dans Swagger
@UseGuards(JwtAuthGuard, RolesGuard) // Protection globale du contrôleur
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @Roles('Manager Catalogue', 'Admin') // Rôles autorisés
  @ApiOperation({ summary: 'Créer une nouvelle promotion' })
  create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionsService.create(createPromotionDto);
  }

    @Post(':id/products')
    @Roles('Manager Catalogue', 'Admin')
    @ApiOperation({
      summary: 'Assigner plusieurs produits à une promotion',
    })
    assignProducts(
      @Param('id') id: string,
      @Body() body: AssignProductsToPromotionDto,
    ) {
      return this.promotionsService.assignProductsToPromotion(id, body);
    }

  @Get()
  @Roles('Manager Catalogue', 'Admin')
  @ApiOperation({ summary: 'Lister toutes les promotions' })
  findAll() {
    return this.promotionsService.findAll();
  }

  @Get(':id')
  @Roles('Manager Catalogue', 'Admin')
  @ApiOperation({ summary: "Détails d'une promotion" })
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('Manager Catalogue', 'Admin')
  @ApiOperation({ summary: 'Modifier une promotion' })
  update(
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(id, updatePromotionDto);
  }

  @Delete(':id')
  @Roles('Admin') // Suppression réservée aux Admins (exemple de granularité)
  @ApiOperation({ summary: 'Supprimer une promotion' })
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
