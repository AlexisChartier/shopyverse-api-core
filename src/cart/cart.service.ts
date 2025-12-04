import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCartSessionDto } from './dto/create-cart-session.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CartItem, CartSession } from '@prisma/client';
import { randomUUID } from 'crypto';

type CartWithItems = CartSession & { items: CartItem[] };

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(dto: CreateCartSessionDto) {
    const cart = await this.prisma.cartSession.create({
      data: {
        sessionId: randomUUID(),
        currency: dto.currency ?? 'EUR',
      },
      include: { items: true },
    });

    return this.toResponse(cart);
  }

  async findBySessionId(sessionId: string) {
    const cart = await this.prisma.cartSession.findUnique({
      where: { sessionId },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundException('Panier introuvable');
    }

    return this.toResponse(cart);
  }

  async replaceItems(sessionId: string, dto: UpdateCartDto) {
    const cart = await this.prisma.cartSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!cart) {
      throw new NotFoundException('Panier introuvable');
    }

    const normalizedItems = this.normalizeItems(dto.items);

    await this.prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      if (normalizedItems.length) {
        await tx.cartItem.createMany({
          data: normalizedItems.map((item) => ({
            cartId: cart.id,
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
      }
    });

    return this.findBySessionId(sessionId);
  }

  async clear(sessionId: string) {
    const cart = await this.prisma.cartSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!cart) {
      throw new NotFoundException('Panier introuvable');
    }

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  private normalizeItems(items: UpdateCartDto['items']) {
    if (!items) {
      throw new BadRequestException('items est requis');
    }

    const map = new Map<string, number>();

    items.forEach((item) => {
      const nextQuantity = (map.get(item.productId) ?? 0) + item.quantity;
      map.set(item.productId, nextQuantity);
    });

    return Array.from(map.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private toResponse(cart: CartWithItems) {
    return {
      id: cart.id,
      sessionId: cart.sessionId,
      currency: cart.currency,
      updatedAt: cart.updatedAt,
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      subtotal: 0,
    };
  }
}
