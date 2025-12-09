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
  @ApiOperation({
    summary: 'Obtenir un résumé agrégé des événements storefront',
  })
  @ApiQuery({ name: 'rangeInDays', required: false, example: 30 })
  @ApiQuery({
    name: 'event',
    required: false,
    description: 'Filtrer par nom dévent',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 5,
    description: 'Nombre maximum dévénements les plus fréquents',
  })
  getSummary(
    @Query('rangeInDays', new DefaultValuePipe(30), ParseIntPipe)
    rangeInDays: number,
    @Query('event') event?: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit?: number,
  ) {
    return this.metricsService.getStorefrontSummary(rangeInDays, {
      event,
      limit,
    });
  }

  @Get('experiments/summary')
  @ApiOperation({
    summary: 'Obtenir un résumé agrégé des expérimentations A/B',
  })
  @ApiQuery({ name: 'rangeInDays', required: false, example: 30 })
  @ApiQuery({
    name: 'experimentId',
    required: false,
    description: 'Filtrer sur une expérimentation spécifique',
  })
  getExperimentsSummary(
    @Query('rangeInDays', new DefaultValuePipe(30), ParseIntPipe)
    rangeInDays: number,
    @Query('experimentId') experimentId?: string,
  ) {
    return this.metricsService.getExperimentsSummary(rangeInDays, {
      experimentId,
    });
  }
}
