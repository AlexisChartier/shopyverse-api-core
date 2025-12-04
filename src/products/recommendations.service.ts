import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
    private readonly RECO_URL = process.env.RECO_SERVICE_URL || 'http://localhost:8001/api';
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async getRecommendations(productId: string) {
    let recommendedIds: string[] = [];

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<string[]>(
          `${this.RECO_URL}/recommendations`,
          {
            params: {
              product_id: productId,
            },
          },
        ),
      );

      if (Array.isArray(data)) {
        recommendedIds = data.filter((id): id is string => typeof id === 'string');
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch recommendations for product ${productId}`);
      return [];
    }

    if (recommendedIds.length === 0) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: recommendedIds,
        },
      },
      include: {
        variants: true,
        medias: true,
        category: true,
      },
    });

    const order = new Map(recommendedIds.map((id, index) => [id, index]));

    return products
      .filter((product) => order.has(product.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }
}