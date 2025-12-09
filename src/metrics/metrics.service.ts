import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  StorefrontEventDto,
  STOREFRONT_EVENT_NAMES,
} from './dto/storefront-event.dto';

type ExperimentEvents = {
  exposure: number;
  click: number;
  add_to_cart: number;
  purchase: number;
  conversion: number;
};

type VariantAggregation = {
  variantName: string;
  events: ExperimentEvents;
};

type ExperimentAggregation = {
  experimentId: string;
  variants: Record<string, VariantAggregation>;
};

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordStorefrontEvent(dto: StorefrontEventDto) {
    const sanitizedPayload = dto.payload
      ? (JSON.parse(JSON.stringify(dto.payload)) as Prisma.InputJsonValue)
      : undefined;

    await this.prisma.storefrontMetricEvent.create({
      data: {
        name: dto.name,
        visitorId: dto.visitorId,
        sessionId: dto.sessionId,
        payload: sanitizedPayload,
        source: dto.source ?? 'storefront',
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      },
    });
  }

  async getStorefrontSummary(
    rangeInDays: number,
    options?: { event?: string; limit?: number },
  ) {
    const safeRange = Math.min(Math.max(rangeInDays, 1), 90);
    const safeLimit = Math.min(Math.max(options?.limit ?? 5, 1), 100);
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (safeRange - 1));

    const where: Prisma.StorefrontMetricEventWhereInput = {
      occurredAt: { gte: since },
      ...(options?.event ? { name: options.event } : {}),
    };

    const [counts, timelineEvents] = await Promise.all([
      this.prisma.storefrontMetricEvent.groupBy({
        by: ['name'],
        where,
        _count: { _all: true },
      }),
      this.prisma.storefrontMetricEvent.findMany({
        where,
        select: { occurredAt: true },
      }),
    ]);

    const eventCounts = counts.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.name] = entry._count._all;
      return acc;
    }, {});

    const totalEvents = counts.reduce(
      (sum, entry) => sum + entry._count._all,
      0,
    );

    const timelineMap = new Map<string, number>();
    timelineEvents.forEach((event) => {
      const key = event.occurredAt.toISOString().slice(0, 10);
      timelineMap.set(key, (timelineMap.get(key) ?? 0) + 1);
    });

    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);

    const timeline = Array.from({ length: safeRange }).map((_, index) => {
      const day = new Date(now);
      day.setUTCDate(day.getUTCDate() - (safeRange - 1 - index));
      const key = day.toISOString().slice(0, 10);
      return {
        date: key,
        count: timelineMap.get(key) ?? 0,
      };
    });

    const filters = {
      search: eventCounts['filter.search'] ?? 0,
      category: eventCounts['filter.category'] ?? 0,
      sort: eventCounts['filter.sort'] ?? 0,
      reset: eventCounts['filter.reset'] ?? 0,
    };

    const cart = {
      added: eventCounts['cart.added'] ?? 0,
      removed: eventCounts['cart.removed'] ?? 0,
      updated: eventCounts['cart.updated'] ?? 0,
    };

    const recommendations = {
      view: eventCounts['recommendation.view'] ?? 0,
      click: eventCounts['recommendation.click'] ?? 0,
      addToCart: eventCounts['recommendation.add_to_cart'] ?? 0,
    };

    const chatbot = {
      open: eventCounts['chat.open'] ?? 0,
      send: eventCounts['chat.send'] ?? 0,
      fallback: eventCounts['chat.fallback'] ?? 0,
    };

    const experiments = {
      exposure: eventCounts['experiment.exposure'] ?? 0,
      click: eventCounts['experiment.click'] ?? 0,
      addToCart: eventCounts['experiment.add_to_cart'] ?? 0,
      purchase: eventCounts['experiment.purchase'] ?? 0,
      conversion: eventCounts['experiment.conversion'] ?? 0,
    };

    const topEvents = counts
      .map((entry) => ({ name: entry.name, count: entry._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, safeLimit);

    return {
      rangeInDays: safeRange,
      event: options?.event,
      limit: safeLimit,
      totalEvents,
      filters,
      cart,
      recommendations,
      chatbot,
      experiments,
      topEvents,
      timeline,
      trackedEvents: STOREFRONT_EVENT_NAMES,
    };
  }

  async getExperimentsSummary(
    rangeInDays: number,
    options?: { experimentId?: string },
  ) {
    const safeRange = Math.min(Math.max(rangeInDays, 1), 90);
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (safeRange - 1));

    const where: Prisma.ABMetricWhereInput = {
      createdAt: { gte: since },
      ...(options?.experimentId ? { experimentId: options.experimentId } : {}),
    };

    const grouped = await this.prisma.aBMetric.groupBy({
      by: ['experimentId', 'variantName', 'eventName'],
      where,
      _count: { _all: true },
    });

    const experiments = grouped.reduce<Record<string, ExperimentAggregation>>(
      (acc, entry) => {
        const experiment = acc[entry.experimentId] ?? {
          experimentId: entry.experimentId,
          variants: {},
        };
        const variant = experiment.variants[entry.variantName] ?? {
          variantName: entry.variantName,
          events: {
            exposure: 0,
            click: 0,
            add_to_cart: 0,
            purchase: 0,
            conversion: 0,
          },
        };

        const eventKey = entry.eventName as keyof ExperimentEvents;
        if (Object.prototype.hasOwnProperty.call(variant.events, eventKey)) {
          variant.events[eventKey] += entry._count._all;
        }

        experiment.variants[entry.variantName] = variant;
        acc[entry.experimentId] = experiment;
        return acc;
      },
      {},
    );

    const results = Object.values(experiments).map((exp) => {
      const variants = Object.values(exp.variants).map((variant) => {
        const exposures = variant.events.exposure || 0;
        const clicks = variant.events.click || 0;
        const addToCart = variant.events.add_to_cart || 0;
        const conversions =
          (variant.events.purchase || 0) + (variant.events.conversion || 0);

        const ctr = exposures > 0 ? clicks / exposures : 0;
        const addToCartRate = exposures > 0 ? addToCart / exposures : 0;
        const conversionRate = exposures > 0 ? conversions / exposures : 0;

        return {
          variantName: variant.variantName,
          events: {
            exposures,
            clicks,
            add_to_cart: addToCart,
            purchases: variant.events.purchase || 0,
            conversions,
          },
          rates: {
            ctr,
            addToCartRate,
            conversionRate,
          },
        };
      });

      const totalEvents = variants.reduce(
        (sum, v) =>
          sum +
          v.events.exposures +
          v.events.clicks +
          v.events.add_to_cart +
          v.events.purchases +
          v.events.conversions,
        0,
      );

      return {
        experimentId: exp.experimentId,
        rangeInDays: safeRange,
        variants,
        totalEvents,
      };
    });

    return {
      rangeInDays: safeRange,
      experimentId: options?.experimentId,
      experiments: results,
    };
  }
}
