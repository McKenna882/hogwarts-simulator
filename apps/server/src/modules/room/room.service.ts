import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  async getUnlockStatus(userId: string) {
    const unlocks = await this.prisma.roomUnlock.findMany({ where: { userId } });
    const da = unlocks.find((u) => u.route === 'da');
    const spew = unlocks.find((u) => u.route === 'spew');

    return {
      da: { progress: da?.progress || 0, unlocked: !!da?.unlockedAt },
      spew: { progress: spew?.progress || 0, unlocked: !!spew?.unlockedAt },
      unlocked: !!(da?.unlockedAt || spew?.unlockedAt),
    };
  }

  async updateProgress(userId: string, route: string, delta = 1) {
    const record = await this.prisma.roomUnlock.upsert({
      where: { userId_route: { userId, route } },
      update: { progress: { increment: delta } },
      create: { userId, route, progress: delta },
    });

    // 进度>=5自动解锁
    if (record.progress >= 5 && !record.unlockedAt) {
      await this.prisma.roomUnlock.update({
        where: { userId_route: { userId, route } },
        data: { unlockedAt: new Date() },
      });
      return { ...record, justUnlocked: true };
    }

    return { ...record, justUnlocked: false };
  }
}
