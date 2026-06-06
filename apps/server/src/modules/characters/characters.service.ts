import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CharactersService {
  constructor(private prisma: PrismaService) {}

  async findAll(house?: string, grade?: string) {
    const where: any = { visibility: 'public' };
    if (house) where.house = house;
    if (grade) where.grade = grade;

    return this.prisma.character.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        house: true,
        grade: true,
        title: true,
        description: true,
        greeting: true,
        sortOrder: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.character.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        house: true,
        grade: true,
        title: true,
        description: true,
        systemPrompt: true,
        greeting: true,
        sortOrder: true,
      },
    });
  }

  async getAffinity(userId: string, characterId: string) {
    const aff = await this.prisma.characterAffinity.findUnique({
      where: { userId_characterId: { userId, characterId } },
    });
    return { affinity: aff?.affinity || 0 };
  }
}
