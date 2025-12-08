import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@ApiTags('Pages')
@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une page personnalisée' })
  create(@Body() createPageDto: CreatePageDto, @Req() req?: Request) {
    const userId =
      (req as (Request & { user?: { userId?: string } }) | undefined)?.user?.userId;
    return this.pagesService.create(createPageDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les pages personnalisées' })
  findAll() {
    return this.pagesService.findAll();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Récupérer une page via son slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.pagesService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une page via son identifiant' })
  findOne(@Param('id') id: string) {
    return this.pagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une page personnalisée' })
  update(
    @Param('id') id: string,
    @Body() updatePageDto: UpdatePageDto,
    @Req() req?: Request,
  ) {
    const userId =
      (req as (Request & { user?: { userId?: string } }) | undefined)?.user?.userId;
    return this.pagesService.update(id, updatePageDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une page personnalisée' })
  remove(@Param('id') id: string, @Req() req?: Request) {
    const userId =
      (req as (Request & { user?: { userId?: string } }) | undefined)?.user?.userId;
    return this.pagesService.remove(id, userId);
  }
}
