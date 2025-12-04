import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { StorefrontEventDto } from './dto/storefront-event.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Post('events')
  @ApiOperation({ summary: 'Enregistrer un événement provenant du storefront' })
  async recordEvent(@Body() dto: StorefrontEventDto) {
    await this.metricsService.recordStorefrontEvent(dto);
    return { status: 'ok' };
  }

  @Get('events/summary')
  @ApiOperation({ summary: 'Obtenir un résumé agrégé des événements storefront' })
  @ApiQuery({ name: 'rangeInDays', required: false, example: 30 })
  getSummary(
    @Query('rangeInDays', new DefaultValuePipe(30), ParseIntPipe) rangeInDays: number,
  ) {
    return this.metricsService.getStorefrontSummary(rangeInDays);
  }
}
