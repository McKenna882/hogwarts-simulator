import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, wallet: true },
    });
    if (!user) throw new NotFoundException('用户不存在');

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      referralCode: user.referralCode,
      profile: user.profile,
      wallet: user.wallet,
    };
  }

  async updateProfile(userId: string, data: {
    displayName?: string;
    nickname?: string;
    wizardTitle?: string;
    house?: string;
    grade?: string;
    team?: string;
    bio?: string;
    avatarUrl?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    // 更新 User 表
    if (data.displayName || data.avatarUrl) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.displayName && { displayName: data.displayName }),
          ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
        },
      });
    }

    // 更新 UserProfile 表
    const profileData: any = {};
    if (data.nickname !== undefined) profileData.nickname = data.nickname;
    if (data.wizardTitle !== undefined) profileData.wizardTitle = data.wizardTitle;
    if (data.house !== undefined) profileData.house = data.house;
    if (data.grade !== undefined) profileData.grade = data.grade;
    if (data.team !== undefined) profileData.team = data.team;
    if (data.bio !== undefined) profileData.bio = data.bio;

    if (Object.keys(profileData).length > 0) {
      await this.prisma.userProfile.update({
        where: { userId },
        data: profileData,
      });
    }

    return this.getProfile(userId);
  }
}
