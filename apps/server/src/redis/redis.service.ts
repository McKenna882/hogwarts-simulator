import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private redis: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);
  private enabled = false;

  constructor() {
    const url = process.env.REDIS_URL;
    if (url && url.startsWith('redis://')) {
      try {
        this.redis = new Redis(url, {
          retryStrategy: (times) => Math.min(times * 50, 2000),
          maxRetriesPerRequest: 1,
          lazyConnect: true,
        });
        this.redis.on('error', () => {
          this.enabled = false;
        });
        this.redis.connect().then(() => {
          this.enabled = true;
          this.logger.log('Redis 已连接');
        }).catch(() => {
          this.enabled = false;
          this.logger.warn('Redis 不可用，缓存功能已禁用');
        });
      } catch {
        this.enabled = false;
      }
    } else {
      this.logger.log('Redis 未配置，缓存功能已禁用');
    }
  }

  isEnabled(): boolean {
    return this.enabled && this.redis !== null;
  }

  async get(key: string): Promise<string | null> {
    if (!this.enabled || !this.redis) return null;
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.enabled || !this.redis) return;
    if (ttlSeconds) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled || !this.redis) return;
    await this.redis.del(key);
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }
}
