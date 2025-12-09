import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAuditDto: CreateAuditDto) {
    const { action, details, userId } = createAuditDto;
    const normalizedDetails = this.normalizeDetails(details);

    const data: Prisma.AuditLogUncheckedCreateInput = {
      action,
      userId,
    };

    if (normalizedDetails !== undefined) {
      data.details = normalizedDetails;
    }

    return this.prisma.auditLog.create({ data });
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
  }) {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit =
      params?.limit && params.limit > 0 ? Math.min(params.limit, 200) : 100;
    const skip = (page - 1) * limit;
    const where = {
      ...(params?.action ? { action: params.action } : {}),
      ...(params?.userId ? { userId: params.userId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const audit = await this.prisma.auditLog.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!audit) {
      throw new NotFoundException('Audit introuvable');
    }
    return audit;
  }

  async update(id: string, updateAuditDto: UpdateAuditDto) {
    await this.ensureExists(id);
    const { action, details } = updateAuditDto;
    const normalizedDetails = this.normalizeDetails(details);

    const data: Prisma.AuditLogUpdateInput = {};

    if (action !== undefined) {
      data.action = action;
    }

    if (normalizedDetails !== undefined) {
      data.details = normalizedDetails;
    }

    return this.prisma.auditLog.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.auditLog.delete({ where: { id } });
  }

  async log(
    action: string,
    userId: string,
    details?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
  ) {
    return this.create({ action, userId, details });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.auditLog.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Audit introuvable');
    }
  }

  private normalizeDetails(
    details?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
  ) {
    if (details === undefined) {
      return undefined;
    }
    if (details === null) {
      return Prisma.JsonNull;
    }
    return details;
  }
}
