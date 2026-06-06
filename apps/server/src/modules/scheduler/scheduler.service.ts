import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private prisma: PrismaService) {}

  // 每天凌晨 00:05 执行每日任务重置
  @Cron(CronExpression.EVERY_DAY_AT_1AM, { name: 'resetDailyTasks' })
  async resetDailyTasks() {
    this.logger.log('开始重置每日任务...');

    try {
      const result = await this.prisma.userTask.updateMany({
        where: {
          status: 'completed',
          task: { resetRule: 'daily' },
        },
        data: {
          status: 'in_progress',
          progress: 0,
          completedAt: null,
        },
      });

      this.logger.log(`每日任务重置完成，影响 ${result.count} 条记录`);
    } catch (error) {
      this.logger.error('重置每日任务失败', error);
    }
  }

  // 每天凌晨 02:00 清理旧签到记录（保留最近 30 天）
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'cleanOldSignIns' })
  async cleanOldSignIns() {
    this.logger.log('开始清理旧签到记录...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.signInRecord.deleteMany({
        where: { signedAt: { lt: thirtyDaysAgo } },
      });

      this.logger.log(`清理完成，删除了 ${result.count} 条旧签到记录`);
    } catch (error) {
      this.logger.error('清理签到记录失败', error);
    }
  }

  // 每天凌晨 03:00 处理待发放的推荐奖励
  @Cron(CronExpression.EVERY_DAY_AT_4AM, { name: 'processReferralRewards' })
  async processReferralRewards() {
    this.logger.log('开始处理推荐奖励...');

    try {
      const pendingRewards = await this.prisma.referralReward.findMany({
        where: { status: 'pending', rewardType: 'galleons' },
      });

      let processed = 0;
      for (const reward of pendingRewards) {
        await this.prisma.$transaction(async (tx) => {
          // 发放加隆给推荐人
          await tx.wallet.update({
            where: { userId: reward.referrerId },
            data: { balanceGalleons: { increment: reward.rewardAmount } },
          });

          // 记录流水
          await tx.walletTransaction.create({
            data: {
              userId: reward.referrerId,
              amount: reward.rewardAmount,
              type: 'referral',
              source: '推荐奖励',
              description: `推荐新用户获得 ${reward.rewardAmount} 加隆`,
            },
          });

          // 标记为已发放
          await tx.referralReward.update({
            where: { id: reward.id },
            data: { status: 'paid' },
          });
        });
        processed++;
      }

      if (processed > 0) {
        this.logger.log(`推荐奖励处理完成，已发放 ${processed} 笔`);
      }
    } catch (error) {
      this.logger.error('处理推荐奖励失败', error);
    }
  }
}
