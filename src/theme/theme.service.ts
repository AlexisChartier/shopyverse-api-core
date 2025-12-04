import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UpdateThemeSettingsDto } from './dto/update-theme-settings.dto';

const THEME_SETTINGS_ID = 'default';

@Injectable()
export class ThemeService {
  constructor(private readonly prisma: PrismaService) {}

  async getTheme() {
    const theme = await this.prisma.themeSetting.findUnique({ where: { id: THEME_SETTINGS_ID } });
    if (theme) {
      return theme;
    }

    return this.prisma.themeSetting.create({
      data: { id: THEME_SETTINGS_ID },
    });
  }

  async updateTheme(dto: UpdateThemeSettingsDto) {
    const payload: Prisma.ThemeSettingUpdateInput = {};

    if (dto.primaryColor !== undefined) {
      payload.primaryColor = dto.primaryColor;
    }
    if (dto.secondaryColor !== undefined) {
      payload.secondaryColor = dto.secondaryColor;
    }
    if (dto.accentColor !== undefined) {
      payload.accentColor = dto.accentColor;
    }
    if (dto.fontFamily !== undefined) {
      payload.fontFamily = dto.fontFamily;
    }
    if (dto.logo !== undefined) {
      payload.logo = dto.logo;
    }
    if (dto.storeName !== undefined) {
      payload.storeName = dto.storeName;
    }
    if (dto.storeDescription !== undefined) {
      payload.storeDescription = dto.storeDescription;
    }
    if (dto.headerLayout !== undefined) {
      payload.headerLayout = dto.headerLayout;
    }
    if (dto.footerText !== undefined) {
      payload.footerText = dto.footerText;
    }

    return this.prisma.themeSetting.upsert({
      where: { id: THEME_SETTINGS_ID },
      create: {
        id: THEME_SETTINGS_ID,
        primaryColor: dto.primaryColor ?? '#030213',
        secondaryColor: dto.secondaryColor ?? '#6366f1',
        accentColor: dto.accentColor ?? '#f59e0b',
        fontFamily: dto.fontFamily ?? 'Inter',
        logo: dto.logo,
        storeName: dto.storeName ?? 'Ma Boutique',
        storeDescription:
          dto.storeDescription ?? 'Découvrez nos produits de qualité supérieure',
        headerLayout: dto.headerLayout ?? 'centered',
        footerText: dto.footerText ?? '© 2024 Ma Boutique. Tous droits réservés.',
      },
      update: payload,
    });
  }
}
