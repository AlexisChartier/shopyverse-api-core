import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: true;
    customer: {
      include: {
        orders: { select: { total: true } };
        _count: { select: { orders: true } };
      };
    };
  };
}>;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const { items, shippingAddress, ...orderData } = dto;

    const order = await this.prisma.order.create({
      data: {
        ...orderData,
        shippingAddress,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            imageUrl: item.imageUrl,
          })),
        },
      },
      include: {
        items: true,
        customer: {
          include: {
            orders: { select: { total: true } },
            _count: { select: { orders: true } },
          },
        },
      },
    });

    return this.mapOrder(order);
  }

  async findAll() {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        customer: {
          include: {
            orders: { select: { total: true } },
            _count: { select: { orders: true } },
          },
        },
      },
    });

    return orders.map((order) => this.mapOrder(order));
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: {
          include: {
            orders: { select: { total: true } },
            _count: { select: { orders: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return this.mapOrder(order);
  }

  async update(id: string, dto: UpdateOrderDto) {
    const { items, shippingAddress, ...orderData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Order ${id} not found`);
      }

      await tx.order.update({
        where: { id },
        data: {
          ...orderData,
          ...(shippingAddress && { shippingAddress }),
        },
      });

      if (items) {
        await tx.orderItem.deleteMany({ where: { orderId: id } });
        if (items.length) {
          await tx.orderItem.createMany({
            data: items.map((item) => ({
              orderId: id,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              imageUrl: item.imageUrl,
            })),
          });
        }
      }

      const updated = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
          customer: {
            include: {
              orders: { select: { total: true } },
              _count: { select: { orders: true } },
            },
          },
        },
      });

      return this.mapOrder(updated as OrderWithRelations);
    });
  }

  remove(id: string) {
    return this.prisma.order.delete({ where: { id } });
  }

  private mapOrder(order: OrderWithRelations) {
    const subtotal = Number(order.subtotal ?? 0);
    const tax = Number(order.tax ?? 0);
    const shipping = Number(order.shipping ?? 0);
    const total = Number(order.total ?? 0);
    const items = order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice ?? 0),
    }));

    const { orders, _count, ...customerData } = order.customer;
    const totalSpent = orders.reduce((sum, curr) => sum + Number(curr.total ?? 0), 0);

    return {
      ...order,
      subtotal,
      tax,
      shipping,
      total,
      items,
      customer: {
        ...customerData,
        ordersCount: _count.orders,
        totalSpent,
      },
    };
  }
}
