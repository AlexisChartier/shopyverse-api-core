import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AssignExperimentDto } from './dto/assign-experiment.dto';
import { ExperimentEventDto } from './dto/experiment-event.dto';

export type ExperimentVariant = {
  name: string;
  weight: number;
  description?: string;
  payload?: Record<string, unknown>;
};

export type ExperimentDefinition = {
  id: string;
  name: string;
  status: 'active' | 'paused';
  variants: ExperimentVariant[];
  metadata?: Record<string, unknown>;
};

const EXPERIMENTS: Record<string, ExperimentDefinition> = {
  'pdp-reco-block': {
    id: 'pdp-reco-block',
    name: 'PDP recommendation block: Standard vs Promo-focused',
    status: 'active',
    variants: [
      {
        name: 'standard',
        weight: 50,
        description: 'Standard recommendation block (current logic).',
      },
      {
        name: 'promo',
        weight: 50,
        description:
          'Promo-focused recommendations (prioritize discounted/promoted items).',
      },
    ],
    metadata: {
      surface: 'pdp',
      metricGoals: ['ctr', 'add_to_cart', 'purchase'],
    },
  },
};

@Injectable()
export class ExperimentsService {
  constructor(private readonly prisma: PrismaService) {}

  getExperiment(experimentId: string): ExperimentDefinition {
    const experiment = EXPERIMENTS[experimentId];
    if (!experiment) {
      throw new BadRequestException(`Experiment ${experimentId} not found`);
    }
    return experiment;
  }

  listExperiments(): ExperimentDefinition[] {
    return Object.values(EXPERIMENTS);
  }

  async assign(dto: AssignExperimentDto) {
    const experiment = this.getExperiment(dto.experimentId);

    if (experiment.status !== 'active') {
      throw new BadRequestException(
        `Experiment ${experiment.id} is not active`,
      );
    }

    const identifier = dto.visitorId ?? dto.sessionId;
    if (!identifier) {
      throw new BadRequestException(
        'visitorId or sessionId is required for assignment',
      );
    }

    const bucket = this.hashToBucket(identifier);
    const variant = this.pickVariant(experiment.variants, bucket);

    if (dto.recordExposure !== false) {
      await this.recordEvent({
        experimentId: experiment.id,
        variantName: variant.name,
        eventName: 'exposure',
        visitorId: dto.visitorId,
        sessionId: dto.sessionId,
        payload: dto.payload,
      });
    }

    return {
      experimentId: experiment.id,
      variantName: variant.name,
      variant,
      experiment,
      bucket,
    };
  }

  async recordEvent(dto: ExperimentEventDto) {
    const experiment = this.getExperiment(dto.experimentId);

    await this.prisma.aBMetric.create({
      data: {
        experimentId: experiment.id,
        variantName: dto.variantName,
        eventName: dto.eventName,
        visitorId: dto.visitorId,
      },
    });

    await this.prisma.storefrontMetricEvent.create({
      data: {
        name: `experiment.${dto.eventName}`,
        source: 'experiment',
        visitorId: dto.visitorId,
        sessionId: dto.sessionId,
        payload: {
          experimentId: experiment.id,
          variantName: dto.variantName,
          ...(dto.payload ?? {}),
        } as Prisma.InputJsonValue,
        occurredAt: new Date(),
      },
    });

    return { status: 'ok' };
  }

  private hashToBucket(identifier: string): number {
    let hash = 0;
    for (let i = 0; i < identifier.length; i += 1) {
      hash = (hash << 5) - hash + identifier.charCodeAt(i);
      hash |= 0; // keep 32-bit int
    }
    return Math.abs(hash) % 100;
  }

  private pickVariant(
    variants: ExperimentVariant[],
    bucket: number,
  ): ExperimentVariant {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight <= 0) {
      throw new BadRequestException('Experiment variants have no weight');
    }

    const target = (bucket / 100) * totalWeight;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.weight;
      if (target < cumulative) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }
}
