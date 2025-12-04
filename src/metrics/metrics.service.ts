import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { StorefrontEventDto, STOREFRONT_EVENT_NAMES } from './dto/storefront-event.dto';

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

	async getStorefrontSummary(rangeInDays: number) {
		const safeRange = Math.min(Math.max(rangeInDays, 1), 90);
		const since = new Date();
		since.setUTCHours(0, 0, 0, 0);
		since.setUTCDate(since.getUTCDate() - (safeRange - 1));

		const [counts, timelineEvents] = await Promise.all([
			this.prisma.storefrontMetricEvent.groupBy({
				by: ['name'],
				where: { occurredAt: { gte: since } },
				_count: { _all: true },
			}),
			this.prisma.storefrontMetricEvent.findMany({
				where: { occurredAt: { gte: since } },
				select: { occurredAt: true },
			}),
		]);

		const eventCounts = counts.reduce<Record<string, number>>((acc, entry) => {
			acc[entry.name] = entry._count._all;
			return acc;
		}, {});

		const totalEvents = counts.reduce((sum, entry) => sum + entry._count._all, 0);

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
			click: eventCounts['recommendation.click'] ?? 0,
			addToCart: eventCounts['recommendation.add_to_cart'] ?? 0,
		};

		const topEvents = counts
			.map((entry) => ({ name: entry.name, count: entry._count._all }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		return {
			rangeInDays: safeRange,
			totalEvents,
			filters,
			cart,
			recommendations,
			topEvents,
			timeline,
			trackedEvents: STOREFRONT_EVENT_NAMES,
		};
	}
}
