import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une catégorie' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister l\'arborescence des catégories (Racines + Enfants)' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('flat')
  @ApiOperation({ summary: 'Liste plate de toutes les catégories (pour Selects)' })
  findAllFlat() {
    return this.categoriesService.findAllFlat();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une catégorie par ID' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une catégorie' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une catégorie' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}