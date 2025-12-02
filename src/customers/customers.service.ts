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

  create(createCustomerDto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: createCustomerDto });
  }

  async findAll() {
    const customers = await this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        orders: { select: { total: true } },
        _count: { select: { orders: true } },
      },
    });

    return customers.map((customer) => this.mapCustomer(customer));
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

  update(id: string, updateCustomerDto: UpdateCustomerDto) {
    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  remove(id: string) {
    return this.prisma.customer.delete({ where: { id } });
  }

  private mapCustomer(customer: CustomerWithStats) {
    const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const { orders, _count, ...rest } = customer;

    return {
      ...rest,
      ordersCount: _count.orders,
      totalSpent,
    };
  }
}
