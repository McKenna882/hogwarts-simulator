import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { HouseCupService } from './house-cup.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('house-cup')
@UseGuards(JwtAuthGuard)
export class HouseCupController {
  constructor(private houseCupService: HouseCupService) {}

  // 学院排名
  @Get()
  getStandings() {
    return this.houseCupService.getStandings();
  }

  // 积分日志
  @Get('logs')
  getLogs(@Query('house') house?: string) {
    return this.houseCupService.getLogs(house);
  }

  // ── 学院杯每日答题 ──

  // 获取今日10道题目
  @Get('quiz/questions')
  getDailyQuestions() {
    return this.houseCupService.getDailyQuizQuestions();
  }

  // 提交答题结果
  @Post('quiz/submit')
  submitQuizResult(
    @CurrentUser('userId') userId: string,
    @Body() body: { house: string; correctCount: number },
  ) {
    return this.houseCupService.submitQuizResult(userId, body.house, body.correctCount);
  }

  // 检查今日是否已答题
  @Get('quiz/today')
  checkQuizToday(@CurrentUser('userId') userId: string) {
    return this.houseCupService.checkQuizCompleted(userId);
  }

  // ── 布告栏任务 ──

  // 获取今日布告栏
  @Get('bulletin')
  getBulletin(@CurrentUser('userId') userId: string) {
    return this.houseCupService.getBulletinTasks(userId);
  }

  // 领取布告栏奖励
  @Post('bulletin/claim')
  claimBulletin(
    @CurrentUser('userId') userId: string,
    @Body() body: { difficulty: string },
  ) {
    return this.houseCupService.claimBulletinReward(userId, body.difficulty);
  }

  // ── 分院锁定 ──

  @Post('lock-house')
  lockHouse(@CurrentUser('userId') userId: string) {
    return this.houseCupService.lockHouse(userId);
  }

  // ── 魁地奇 ──

  @Post('quidditch/win')
  quidditchWin(
    @CurrentUser('userId') userId: string,
    @Body() body: { house: string },
  ) {
    return this.houseCupService.addQuidditchPoints(userId, body.house);
  }

  // ── 原有论文答题（保留兼容） ──

  @Get('quizzes')
  getQuizzes() {
    return this.houseCupService.getQuizzes();
  }

  @Post('quizzes/:id/submit')
  submitQuiz(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() body: { answer: string },
  ) {
    return this.houseCupService.submitQuiz(userId, id, body.answer);
  }
}