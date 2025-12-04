import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThemeService } from './theme.service';
import { UpdateThemeSettingsDto } from './dto/update-theme-settings.dto';

@ApiTags('Theme')
@Controller('theme')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  @ApiOperation({ summary: 'Obtenir les paramètres du thème storefront' })
  findOne() {
    return this.themeService.getTheme();
  }

  @Put()
  @ApiOperation({ summary: 'Mettre à jour les paramètres du thème storefront' })
  update(@Body() dto: UpdateThemeSettingsDto) {
    return this.themeService.updateTheme(dto);
  }
}
