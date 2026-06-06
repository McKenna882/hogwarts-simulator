import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RechargeService } from '../recharge/recharge.service';
import { AdminUpsertRechargePackageDto } from './dto/admin-wallet-adjust.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private rechargeService: RechargeService,
  ) {}

  async getOverview() {
    const [users, activeUsers, pendingRechargeOrders, paidRechargeOrders, totalWallets] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.rechargeOrder.count({ where: { status: 'pending' } }),
      this.prisma.rechargeOrder.count({ where: { status: 'paid' } }),
      this.prisma.wallet.aggregate({ _sum: { balanceGalleons: true } }),
    ]);

    return {
      users,
      activeUsers,
      pendingRechargeOrders,
      paidRechargeOrders,
      totalGalleons: totalWallets._sum.balanceGalleons || 0,
    };
  }

  async getUsers(page = 1, limit = 20, keyword?: string) {
    const skip = (page - 1) * limit;
    const where = keyword
      ? {
          OR: [
            { email: { contains: keyword, mode: 'insensitive' as const } },
            { displayName: { contains: keyword, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          status: true,
          createdAt: true,
          wallet: true,
          profile: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, wallet: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserStatus(adminUserId: string, userId: string, status: string) {
    if (!['active', 'banned'].includes(status)) {
      throw new BadRequestException('Invalid user status');
    }

    const before = await this.getUser(userId);
    const user = await this.prisma.user.update({ where: { id: userId }, data: { status } });
    await this.createAuditLog(adminUserId, 'user.update_status', 'user', userId, before, { status });
    return user;
  }

  async adjustWallet(adminUserId: string, userId: string, amount: number, reason: string) {
    if (amount === 0) throw new BadRequestException('Amount cannot be zero');

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      if (wallet.balanceGalleons + amount < 0) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: { balanceGalleons: { increment: amount } },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          amount,
          type: 'admin',
          source: `admin:${adminUserId}`,
          description: reason,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminUserId,
          action: 'wallet.adjust',
          targetType: 'user',
          targetId: userId,
          beforeJson: this.toJson({ balanceGalleons: wallet.balanceGalleons }),
          afterJson: this.toJson({ balanceGalleons: updatedWallet.balanceGalleons, amount, reason }),
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  getWalletTransactions(page = 1, limit = 20, userId?: string) {
    const skip = (page - 1) * limit;
    const where = userId ? { userId } : undefined;

    return Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]).then(([transactions, total]) => ({ transactions, total, page, limit }));
  }

  getRechargePackages() {
    return this.rechargeService.getPackages(true);
  }

  createRechargePackage(adminUserId: string, dto: AdminUpsertRechargePackageDto) {
    return this.prisma.rechargePackage
      .create({ data: dto })
      .then(async (pkg) => {
        await this.createAuditLog(adminUserId, 'recharge_package.create', 'recharge_package', pkg.id, null, pkg);
        return pkg;
      });
  }

  async updateRechargePackage(adminUserId: string, id: string, dto: Partial<AdminUpsertRechargePackageDto> & { isActive?: boolean }) {
    const before = await this.prisma.rechargePackage.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Recharge package not found');

    const pkg = await this.prisma.rechargePackage.update({ where: { id }, data: dto });
    await this.createAuditLog(adminUserId, 'recharge_package.update', 'recharge_package', id, before, pkg);
    return pkg;
  }

  async getRechargeOrders(page = 1, limit = 20, status?: string, userId?: string) {
    const skip = (page - 1) * limit;
    const where = {
      ...(status ? { status } : {}),
      ...(userId ? { userId } : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.rechargeOrder.findMany({
        where,
        include: { package: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.rechargeOrder.count({ where }),
    ]);

    return { orders, total, page, limit };
  }

  getRechargeOrder(id: string) {
    return this.prisma.rechargeOrder.findUnique({ where: { id }, include: { package: true } });
  }

  async markRechargePaid(adminUserId: string, id: string) {
    const order = await this.prisma.rechargeOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Recharge order not found');

    const result = await this.rechargeService.markOrderPaid(order.orderNo, `admin-${Date.now()}`);
    await this.createAuditLog(adminUserId, 'recharge_order.mark_paid', 'recharge_order', id, order, result.order);
    return result;
  }

  getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return Promise.all([
      this.prisma.adminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.adminAuditLog.count(),
    ]).then(([logs, total]) => ({ logs, total, page, limit }));
  }

  private createAuditLog(adminUserId: string, action: string, targetType?: string, targetId?: string, beforeJson?: any, afterJson?: any) {
    return this.prisma.adminAuditLog.create({
      data: {
        adminUserId,
        action,
        targetType,
        targetId,
        beforeJson: this.toJson(beforeJson),
        afterJson: this.toJson(afterJson),
      },
    });
  }

  private toJson(value: any) {
    if (value === undefined || value === null) return value;
    return JSON.stringify(value);
  }
}
