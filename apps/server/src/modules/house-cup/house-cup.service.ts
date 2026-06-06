import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** 学院杯积分模型 —— 从 OwlPost 移植，含每日答题/布告栏任务/魁地奇加分 */

const QUIZ_COUNT = 10; // 每日10题
const QUIZ_TIME_LIMIT = 15; // 每题15秒

/** 答题等级映射 */
function scoreToGrade(correct: number) {
  if (correct >= 9) return { grade: 'O', name: '杰出', points: 20 };
  if (correct >= 7) return { grade: 'E', name: '良好', points: 10 };
  if (correct >= 6) return { grade: 'A', name: '及格', points: 5 };
  if (correct >= 4) return { grade: 'P', name: '差', points: -5 };
  if (correct >= 2) return { grade: 'D', name: '很差', points: -10 };
  return { grade: 'T', name: '巨怪', points: -20 };
}

/** 当天日期键值 YYYY-MM-DD */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 布告栏任务定义
interface BulletinTask {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  title: string;
  description: string;
  housePoints: number;
  galleons: number;
  type: 'proxy_shopping' | 'prank_development' | 'forest_patrol';
}

function generateBulletinTasks(): BulletinTask[] {
  const id = () => `bt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  return [
    {
      id: id(),
      difficulty: 'easy',
      title: '代购委托',
      description: '帮助一位同学从对角巷带回指定物品。',
      housePoints: 5,
      galleons: 5,
      type: 'proxy_shopping',
    },
    {
      id: id(),
      difficulty: 'medium',
      title: '恶作剧产品测试',
      description: '帮助韦斯莱双子测试新型恶作剧产品。据说有些副作用。',
      housePoints: 10,
      galleons: 10,
      type: 'prank_development',
    },
    {
      id: id(),
      difficulty: 'hard',
      title: '禁林巡逻',
      description: '作为高年级学生巡逻禁林，需完成完整的20轮探险。',
      housePoints: 20,
      galleons: 20,
      type: 'forest_patrol',
    },
  ];
}

@Injectable()
export class HouseCupService {
  private readonly logger = new Logger(HouseCupService.name);

  constructor(private prisma: PrismaService) {}

  /** 1. 获取学院积分排名 */
  async getStandings() {
    return this.prisma.house.findMany({
      orderBy: { points: 'desc' },
    });
  }

  /** 2. 获取积分变动日志 */
  async getLogs(house?: string) {
    const where: any = {};
    if (house) where.house = house;
    return this.prisma.housePointLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /** 3. 给学院加分（核心方法） */
  async addPoints(house: string, userId: string, points: number, source: string, description?: string) {
    if (points === 0) return true;
    await this.prisma.$transaction(async (tx) => {
      await tx.housePointLog.create({
        data: { userId, house, points, source, description: description || '' },
      });
      // 重算学院总分
      const agg = await tx.housePointLog.aggregate({
        where: { house },
        _sum: { points: true },
      });
      await tx.house.update({
        where: { name: house },
        data: { points: agg._sum.points || 0 },
      });
    });
    this.logger.log(`🏆 +${points} to ${house} (${source})`);
    return true;
  }

  // ════════════════════════════════════════════
  // 每日学院杯答题（10题 / 计时 / 等级评分）
  // ════════════════════════════════════════════

  /** 获取当日10道随机题目 */
  async getDailyQuizQuestions() {
    const all = await this.prisma.houseCupQuizQuestion.findMany();
    // 随机打乱取10题
    const shuffled = all.sort(() => Math.random() - 0.5).slice(0, QUIZ_COUNT);
    return shuffled.map((q) => ({
      id: q.id,
      question: q.question,
      options: JSON.parse(q.optionsJson),
    }));
  }

  /** 提交答题结果 */
  async submitQuizResult(userId: string, house: string, correctCount: number) {
    const dayKey = todayKey();

    // 查重 —— 每人每天只能答一次
    const existing = await this.prisma.houseCupQuizRecord.findUnique({
      where: { userId_dayKey: { userId, dayKey } },
    });
    if (existing) {
      throw new BadRequestException('今天已经答过题了，明天再来吧！');
    }

    const result = scoreToGrade(correctCount);

    // 写入记录
    await this.prisma.houseCupQuizRecord.create({
      data: {
        userId,
        house,
        dayKey,
        score: correctCount,
        points: result.points,
        grade: result.grade,
      },
    });

    // 加学院分
    if (result.points !== 0) {
      await this.addPoints(house, userId, result.points, 'quiz', `学院杯答题获得 ${result.grade} (${result.name})`);
    }

    return {
      grade: result.grade,
      name: result.name,
      points: result.points,
      correctCount,
      total: QUIZ_COUNT,
    };
  }

  /** 检查今日是否已答题 */
  async checkQuizCompleted(userId: string) {
    const dayKey = todayKey();
    const record = await this.prisma.houseCupQuizRecord.findUnique({
      where: { userId_dayKey: { userId, dayKey } },
    });
    return { completed: !!record, grade: record?.grade || null, points: record?.points || null };
  }

  // ════════════════════════════════════════════
  // 布告栏任务系统
  // ════════════════════════════════════════════

  /** 获取今日布告栏任务（自动生成，每日缓存） */
  async getBulletinTasks(userId: string) {
    const dayKey = todayKey();
    const existing = await this.prisma.bulletinTaskState.findUnique({
      where: { userId_dayKey: { userId, dayKey } },
    });

    if (existing) {
      return {
        tasks: JSON.parse(existing.tasksJson),
        quizCompleted: existing.quizCompleted,
        completedDifficulties: JSON.parse(existing.completedDifficulties),
      };
    }

    // 首次访问今天，生成任务
    const tasks = generateBulletinTasks();
    await this.prisma.bulletinTaskState.create({
      data: {
        userId,
        dayKey,
        tasksJson: JSON.stringify(tasks),
        quizCompleted: false,
        completedDifficulties: '[]',
      },
    });

    return { tasks, quizCompleted: false, completedDifficulties: [] };
  }

  /** 领取任务奖励 */
  async claimBulletinReward(userId: string, difficulty: string) {
    const dayKey = todayKey();
    const state = await this.prisma.bulletinTaskState.findUnique({
      where: { userId_dayKey: { userId, dayKey } },
    });
    if (!state) throw new BadRequestException('今日布告栏未初始化');

    const completed: string[] = JSON.parse(state.completedDifficulties);
    if (completed.includes(difficulty)) {
      throw new BadRequestException('该难度任务今日已完成');
    }

    const tasks: BulletinTask[] = JSON.parse(state.tasksJson);
    const task = tasks.find((t) => t.difficulty === difficulty);
    if (!task) throw new BadRequestException('任务不存在');

    // 标记完成
    completed.push(difficulty);
    await this.prisma.bulletinTaskState.update({
      where: { userId_dayKey: { userId, dayKey } },
      data: { completedDifficulties: JSON.stringify(completed) },
    });

    // 发放加隆
    const user = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (user?.house) {
      await this.addPoints(user.house, userId, task.housePoints, 'bulletin', `布告栏任务: ${task.title}`);
    }

    if (task.galleons > 0) {
      await this.prisma.wallet.update({
        where: { userId },
        data: { balanceGalleons: { increment: task.galleons } },
      });
    }

    return {
      claimed: true,
      housePoints: task.housePoints,
      galleons: task.galleons,
      difficulty,
    };
  }

  // ════════════════════════════════════════════
  // 分院锁定
  // ════════════════════════════════════════════

  /** 锁定学院（不可更改） */
  async lockHouse(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException('用户资料不存在');
    if (!profile.house) throw new BadRequestException('请先选择学院');
    if (profile.houseLocked) throw new BadRequestException('学院已经锁定');

    await this.prisma.userProfile.update({
      where: { userId },
      data: { houseLocked: true },
    });

    return { locked: true, house: profile.house };
  }

  // ════════════════════════════════════════════
  // 魁地奇加分
  // ════════════════════════════════════════════

  /** 魁地奇比赛获胜加分（+50） */
  async addQuidditchPoints(userId: string, house: string) {
    return this.addPoints(house, userId, 50, 'quidditch', '魁地奇比赛获胜');
  }

  // ════════════════════════════════════════════
  // 原有论文答题（保留兼容）
  // ════════════════════════════════════════════

  async getQuizzes() {
    return this.prisma.quiz.findMany({
      select: {
        id: true,
        question: true,
        optionsJson: true,
        rewardPoints: true,
        rewardGalleons: true,
      },
    });
  }

  async submitQuiz(userId: string, quizId: string, answer: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new BadRequestException('题目不存在');

    const correct = quiz.answer === answer;
    if (!correct) return { correct: false };

    await this.prisma.$transaction(async (tx) => {
      if (quiz.rewardGalleons > 0) {
        await tx.wallet.update({
          where: { userId },
          data: { balanceGalleons: { increment: quiz.rewardGalleons } },
        });
      }
      const user = await tx.userProfile.findUnique({ where: { userId } });
      if (user?.house && quiz.rewardPoints > 0) {
        await tx.housePointLog.create({
          data: {
            userId,
            house: user.house,
            points: quiz.rewardPoints,
            source: 'quiz',
            description: '论文答题正确',
          },
        });
      }
    });

    return { correct: true, rewardGalleons: quiz.rewardGalleons, rewardPoints: quiz.rewardPoints };
  }
}