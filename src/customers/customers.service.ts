import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

type CustomerWithStats = Prisma.CustomerGetPayload<{
  include: {
    orders: { select: { total: true } };
    _count: { select: { orders: true } };
  };
}>;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: createCustomerDto,
      include: {
        orders: { select: { total: true } },
        _count: { select: { orders: true } },
      },
    });

    return this.mapCustomer(customer);
  }

  async findAll(page = 1, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const [customers, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          orders: { select: { total: true } },
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.customer.count(),
    ]);

    return {
      data: customers.map((customer) => this.mapCustomer(customer)),
      meta: {
        page,
        limit: take,
        total,
        pageCount: Math.ceil(total / take) || 1,
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: { select: { total: true } },
        _count: { select: { orders: true } },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    return this.mapCustomer(customer);
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
      include: {
        orders: { select: { total: true } },
        _count: { select: { orders: true } },
      },
    });

    return this.mapCustomer(customer);
  }

  remove(id: string) {
    return this.prisma.customer.delete({ where: { id } });
  }

  private mapCustomer(customer: CustomerWithStats) {
    const { orders, _count, ...rest } = customer;
    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.total ?? 0),
      0,
    );

    return {
      ...rest,
      ordersCount: _count.orders,
      totalSpent,
    };
  }
}
