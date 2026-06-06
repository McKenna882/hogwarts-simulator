import { Module } from '@nestjs/common';
import { RechargeModule } from '../recharge/recharge.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [RechargeModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
