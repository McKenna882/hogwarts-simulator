import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { CharactersModule } from './modules/characters/characters.module';
import { ChatModule } from './modules/chat/chat.module';
import { ShopModule } from './modules/shop/shop.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PostsModule } from './modules/posts/posts.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { HouseCupModule } from './modules/house-cup/house-cup.module';
import { PetsModule } from './modules/pets/pets.module';
import { RoomModule } from './modules/room/room.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { RechargeModule } from './modules/recharge/recharge.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // 限流 — 防止暴力请求
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // 基础设施
    PrismaModule,
    RedisModule,

    // 功能模块
    AuthModule,
    UsersModule,
    WalletModule,
    CharactersModule,
    ChatModule,
    ShopModule,
    InventoryModule,
    PostsModule,
    TasksModule,
    HouseCupModule,
    PetsModule,
    RoomModule,
    SchedulerModule,
    RechargeModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
