import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RechargeService {
  constructor(private prisma: PrismaService) {}

  getPackages(includeInactive = false) {
    return this.prisma.rechargePackage.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { amountCents: 'asc' }],
    });
  }

  async createOrder(userId: string, packageId: string) {
    const pkg = await this.prisma.rechargePackage.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.isActive) {
      throw new NotFoundException('Recharge package not found');
    }

    const order = await this.prisma.rechargeOrder.create({
      data: {
        orderNo: this.createOrderNo(),
        userId,
        packageId: pkg.id,
        amountCents: pkg.amountCents,
        galleons: pkg.galleons,
        bonusGalleons: pkg.bonusGalleons,
        channel: 'virtual',
        virtualPayKey: this.createVirtualPayKey(),
      },
    });

    return this.formatOrder(order, true);
  }

  async getOrder(userId: string, orderNo: string) {
    const order = await this.prisma.rechargeOrder.findFirst({
      where: { userId, orderNo },
      include: { package: true },
    });
    return order ? this.formatOrder(order, order.status === 'pending') : null;
  }

  async getMyOrders(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.rechargeOrder.findMany({
        where: { userId },
        include: { package: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.rechargeOrder.count({ where: { userId } }),
    ]);

    return { orders: orders.map((order) => this.formatOrder(order, order.status === 'pending')), total, page, limit };
  }

  async virtualPay(userId: string, orderNo: string, key: string) {
    const order = await this.prisma.rechargeOrder.findFirst({ where: { userId, orderNo } });
    if (!order) throw new NotFoundException('Recharge order not found');
    if (order.status === 'paid') return { order: this.formatOrder(order, false), alreadyPaid: true };
    if (!order.virtualPayKey || order.virtualPayKey !== key) {
      throw new UnauthorizedException('Invalid virtual recharge key');
    }

    return this.markOrderPaid(order.orderNo, `virtual-${Date.now()}`);
  }

  async markOrderPaid(orderNo: string, providerTradeNo?: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.rechargeOrder.findUnique({ where: { orderNo } });
      if (!order) throw new NotFoundException('Recharge order not found');

      if (order.status === 'paid') {
        return { order, alreadyPaid: true };
      }

      if (order.status !== 'pending') {
        throw new BadRequestException(`Recharge order is ${order.status}`);
      }

      const totalGalleons = order.galleons + order.bonusGalleons;
      const paidOrder = await tx.rechargeOrder.update({
        where: { orderNo },
        data: {
          status: 'paid',
          paidAt: new Date(),
          virtualPayKey: null,
          providerTradeNo: providerTradeNo || `manual-${Date.now()}`,
        },
      });

      await tx.wallet.update({
        where: { userId: order.userId },
        data: { balanceGalleons: { increment: totalGalleons } },
      });

      await tx.walletTransaction.create({
        data: {
          userId: order.userId,
          amount: totalGalleons,
          type: 'recharge',
          source: order.channel,
          description: `兑换 ${totalGalleons} 金加隆`,
          orderId: paidOrder.id,
        },
      });

      return { order: this.formatOrder(paidOrder, false), alreadyPaid: false };
    });
  }

  private createOrderNo() {
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `VR${stamp}${random}`;
  }

  private createVirtualPayKey() {
    return `VK-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private formatOrder<T extends { virtualPayKey?: string | null }>(order: T, includeKey: boolean) {
    if (includeKey) return order;
    const { virtualPayKey, ...safeOrder } = order;
    return safeOrder;
  }
}
