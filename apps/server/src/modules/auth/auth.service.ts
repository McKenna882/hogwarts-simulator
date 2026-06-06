import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('该邮箱已被注册');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);
    const referralCode = this.generateReferralCode();

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          displayName: dto.email.split('@')[0],
          referralCode,
          referredBy: dto.referralCode || null,
        },
      });

      await tx.wallet.create({
        data: { userId: newUser.id, balanceGalleons: 0 },
      });

      await tx.userProfile.create({
        data: { userId: newUser.id },
      });

      if (dto.referralCode) {
        const referrer = await tx.user.findUnique({
          where: { referralCode: dto.referralCode },
        });
        if (referrer) {
          await tx.referralReward.create({
            data: {
              referrerId: referrer.id,
              referredUserId: newUser.id,
              rewardType: 'galleons',
              rewardAmount: 10,
              status: 'pending',
            },
          });
        }
      }

      return newUser;
    });

    const tokens = this.generateTokens(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, displayName: user.displayName },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const tokens = this.generateTokens(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, displayName: user.displayName },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'hogwarts-dev-refresh-secret-2024',
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Refresh Token 无效或已过期');
    }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // 即使用户不存在也返回成功，防止枚举攻击
    if (!user) {
      return { message: '如果该邮箱已注册，重置密码链接已发送' };
    }

    // 生成重置令牌
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15分钟有效

    // 作废之前的重置令牌
    await this.prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true, usedAt: new Date() },
    });

    // 创建新令牌
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // 也存一份到 Redis（如果有）
    if (this.redis.isEnabled()) {
      await this.redis.set(`reset:${token}`, user.id, 900);
    }

    // 实际生产环境应发送邮件
    // 开发阶段直接返回 token 方便调试
    return {
      message: '如果该邮箱已注册，重置密码链接已发送',
      ...(process.env.NODE_ENV !== 'production' && { debugToken: token }),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // 先查 Redis
    let userId: string | null = null;
    if (this.redis.isEnabled()) {
      userId = await this.redis.get(`reset:${token}`);
    }

    // 查数据库
    const resetRecord = userId
      ? await this.prisma.passwordReset.findFirst({
          where: { token, userId, used: false, expiresAt: { gte: new Date() } },
        })
      : await this.prisma.passwordReset.findFirst({
          where: { token, used: false, expiresAt: { gte: new Date() } },
        });

    if (!resetRecord) {
      throw new BadRequestException('重置令牌无效或已过期');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      });

      await tx.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true, usedAt: new Date() },
      });
    });

    if (this.redis.isEnabled()) {
      await this.redis.del(`reset:${token}`);
    }

    return { message: '密码已重置成功' };
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'hogwarts-dev-jwt-secret-2024',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'hogwarts-dev-refresh-secret-2024',
    });

    return { accessToken, refreshToken };
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
