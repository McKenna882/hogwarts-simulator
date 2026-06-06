import { Module } from '@nestjs/common';
import { HouseCupController } from './house-cup.controller';
import { HouseCupService } from './house-cup.service';

@Module({
  controllers: [HouseCupController],
  providers: [HouseCupService],
})
export class HouseCupModule {}
