import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { RoomService } from './room.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('room')
export class RoomController {
  constructor(private roomService: RoomService) {}

  @Get()
  getUnlockStatus(@CurrentUser('userId') userId: string) {
    return this.roomService.getUnlockStatus(userId);
  }

  @Post('progress/:route')
  updateProgress(
    @CurrentUser('userId') userId: string,
    @Param('route') route: string,
  ) {
    return this.roomService.updateProgress(userId, route);
  }
}
