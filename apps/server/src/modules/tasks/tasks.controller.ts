import { Controller, Get, Post, Param } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get('daily')
  getDailyTasks(@CurrentUser('userId') userId: string) {
    return this.tasksService.getDailyTasks(userId);
  }

  @Post(':id/progress')
  updateProgress(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.tasksService.updateProgress(userId, id);
  }

  @Post(':id/claim')
  claimReward(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.tasksService.claimReward(userId, id);
  }
}
