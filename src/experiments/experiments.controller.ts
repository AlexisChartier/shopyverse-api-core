import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExperimentsService } from './experiments.service';
import { AssignExperimentDto } from './dto/assign-experiment.dto';
import { ExperimentEventDto } from './dto/experiment-event.dto';

@ApiTags('Experiments')
@Controller('experiments')
export class ExperimentsController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les expérimentations disponibles' })
  list() {
    return this.experimentsService.listExperiments();
  }

  @Get(':experimentId')
  @ApiOperation({ summary: "Récupérer la configuration d'une expérimentation" })
  getOne(@Param('experimentId') experimentId: string) {
    return this.experimentsService.getExperiment(experimentId);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assigner un visiteur/session à une variante' })
  async assign(@Body() dto: AssignExperimentDto) {
    return this.experimentsService.assign(dto);
  }

  @Post('events')
  @ApiOperation({
    summary:
      'Enregistrer un événement (exposure, click, conversion) pour une expérimentation',
  })
  async recordEvent(@Body() dto: ExperimentEventDto) {
    return this.experimentsService.recordEvent(dto);
  }
}
