import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CheckoutRequestDto } from './dto/checkout.dto';

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(dto: CheckoutRequestDto) {
    const cart = await this.prisma.cartSession.findUnique({
      where: { sessionId: dto.sessionId },
      include: { items: true },
    });

    if (!cart) {
      throw new BadRequestException('Panier introuvable');
    }

    if (!cart.items.length) {
      throw new BadRequestException('Panier vide');
    }

    const productIds = cart.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        variants: { orderBy: { sku: 'asc' } },
        medias: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));

    const orderItems = cart.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Produit ${item.productId} introuvable pour la commande`,
        );
      }
      const unitPrice = Number(product.variants[0]?.price ?? 0);
      if (unitPrice <= 0) {
        throw new BadRequestException(`Produit ${product.title} sans prix valide`);
      }
      return {
        productId: product.id,
        productName: product.title,
        quantity: item.quantity,
        unitPrice,
        imageUrl: product.medias[0]?.url,
      };
    });

    const subtotal = orderItems.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    );

    const settings = await this.prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });

    const taxRate = settings?.taxRate ?? 20;
    const shippingFlat = settings?.shippingRate ?? 0;
    const currency = settings?.currency ?? 'EUR';
    const orderPrefix = settings?.orderPrefix ?? 'ORD';

    const tax = (subtotal * taxRate) / 100;
    const shipping = subtotal > 0 ? shippingFlat : 0;
    const total = subtotal + tax + shipping;

    const customer = await this.prisma.customer.upsert({
      where: { email: dto.customer.email },
      update: {
        firstName: dto.customer.firstName,
        lastName: dto.customer.lastName,
        phone: dto.customer.phone,
      },
      create: {
        firstName: dto.customer.firstName,
        lastName: dto.customer.lastName,
        email: dto.customer.email,
        phone: dto.customer.phone,
      },
    });

    const orderNumber = this.generateOrderNumber(orderPrefix);

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.PAID,
        subtotal,
        tax,
        shipping,
        total,
        shippingAddress:
          dto.shippingAddress as unknown as Prisma.InputJsonValue,
        items: {
          create: orderItems.map((line) => ({
            productId: line.productId,
            productName: line.productName,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            imageUrl: line.imageUrl,
          })),
        },
      },
      include: { items: true },
    });

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      subtotal,
      tax,
      shipping,
      total,
      currency,
      estimatedDelivery: new Date(
        Date.now() + 4 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice ?? 0),
        imageUrl: item.imageUrl ?? undefined,
      })),
    };
  }

  private generateOrderNumber(prefix: string) {
    const timestamp = Date.now().toString().slice(-6);
    const randomChunk = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `${prefix}-${timestamp}${randomChunk}`;
  }
}
