import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SETTINGS_ID = 'default';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const settings = await this.prisma.storeSetting.findUnique({ where: { id: SETTINGS_ID } });
    if (settings) {
      return settings;
    }

    return this.prisma.storeSetting.create({
      data: {
        id: SETTINGS_ID,
      },
    });
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const payload: Prisma.StoreSettingUpdateInput = {};

    if (dto.currency !== undefined) {
      payload.currency = dto.currency;
    }
    if (dto.taxRate !== undefined) {
      payload.taxRate = dto.taxRate;
    }
    if (dto.shippingRate !== undefined) {
      payload.shippingRate = dto.shippingRate;
    }
    if (dto.allowedPaymentMethods !== undefined) {
      payload.allowedPaymentMethods = dto.allowedPaymentMethods.filter((method) => method.length > 0);
    }
    if (dto.emailNotifications !== undefined) {
      payload.emailNotifications = dto.emailNotifications;
    }
    if (dto.orderPrefix !== undefined) {
      payload.orderPrefix = dto.orderPrefix;
    }

    return this.prisma.storeSetting.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        currency: dto.currency ?? 'EUR',
        taxRate: dto.taxRate ?? 20,
        shippingRate: dto.shippingRate ?? 0,
        allowedPaymentMethods: dto.allowedPaymentMethods ?? ['card', 'paypal'],
        emailNotifications: dto.emailNotifications ?? true,
        orderPrefix: dto.orderPrefix ?? 'ORD',
      },
      update: payload,
    });
  }
}
