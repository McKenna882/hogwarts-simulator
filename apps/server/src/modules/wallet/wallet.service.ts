import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    return wallet;
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where: { userId } }),
    ]);

    return { transactions, total, page, limit };
  }

  async dailySignIn(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 检查今天是否已签到
    const existing = await this.prisma.signInRecord.findFirst({
      where: {
        userId,
        signedAt: { gte: today },
      },
    });

    if (existing) {
      throw new BadRequestException('今天已经签到过了，明天再来吧');
    }

    // 发放签到奖励（随机 1-5 加隆）
    const reward = Math.floor(Math.random() * 5) + 1;

    await this.prisma.$transaction(async (tx) => {
      await tx.signInRecord.create({
        data: { userId, reward },
      });

      await tx.wallet.update({
        where: { userId },
        data: { balanceGalleons: { increment: reward } },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          amount: reward,
          type: 'signin',
          source: '每日签到',
          description: `签到获得 ${reward} 加隆`,
        },
      });
    });

    return { reward, signedAt: new Date() };
  }

  async checkSignIn(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.signInRecord.findFirst({
      where: {
        userId,
        signedAt: { gte: today },
      },
    });

    return { signedIn: !!existing };
  }
}
