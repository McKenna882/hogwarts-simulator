import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async getDailyTasks(userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { type: 'daily' },
    });

    // 获取用户进度
    const userTasks = await this.prisma.userTask.findMany({
      where: { userId, taskId: { in: tasks.map((t) => t.id) } },
    });

    return tasks.map((task) => {
      const ut = userTasks.find((u) => u.taskId === task.id);
      return {
        ...task,
        progress: ut?.progress || 0,
        status: ut?.status || 'in_progress',
      };
    });
  }

  async updateProgress(userId: string, taskId: string, delta = 1) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('任务不存在');

    const ut = await this.prisma.userTask.upsert({
      where: { userId_taskId: { userId, taskId } },
      update: { progress: { increment: delta } },
      create: { userId, taskId, progress: delta, status: 'in_progress' },
    });

    // 检查是否完成
    if (ut.progress >= task.targetCount && ut.status === 'in_progress') {
      await this.prisma.userTask.update({
        where: { userId_taskId: { userId, taskId } },
        data: { status: 'completed' },
      });
      return { ...ut, status: 'completed', justCompleted: true };
    }

    return { ...ut, justCompleted: false };
  }

  async claimReward(userId: string, taskId: string) {
    const ut = await this.prisma.userTask.findUnique({
      where: { userId_taskId: { userId, taskId } },
      include: { task: true },
    });
    if (!ut || ut.status !== 'completed') {
      throw new BadRequestException('任务尚未完成');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userTask.update({
        where: { userId_taskId: { userId, taskId } },
        data: { status: 'claimed' },
      });
      if (ut.task.rewardGalleons > 0) {
        await tx.wallet.update({
          where: { userId },
          data: { balanceGalleons: { increment: ut.task.rewardGalleons } },
        });
      }
      if (ut.task.rewardPoints > 0) {
        const user = await tx.userProfile.findUnique({ where: { userId } });
        if (user?.house) {
          await tx.housePointLog.create({
            data: {
              userId,
              house: user.house,
              points: ut.task.rewardPoints,
              source: 'task',
              description: `完成任务: ${ut.task.title}`,
            },
          });
          // 更新学院总积分
          const totalPoints = await tx.housePointLog.aggregate({
            where: { house: user.house },
            _sum: { points: true },
          });
          await tx.house.update({
            where: { name: user.house },
            data: { points: totalPoints._sum.points || 0 },
          });
        }
      }
    });

    return { claimed: true, rewardGalleons: ut.task.rewardGalleons, rewardPoints: ut.task.rewardPoints };
  }
}
