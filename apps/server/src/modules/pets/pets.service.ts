import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  async getPets(userId: string) {
    return this.prisma.pet.findMany({ where: { userId } });
  }

  async hatchEgg(userId: string, inventoryId: string, name?: string) {
    const item = await this.prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (!item || item.userId !== userId) throw new NotFoundException('物品不存在');
    if (item.itemType !== 'pet_egg') throw new BadRequestException('这不是龙蛋');
    if (item.quantity < 1) throw new BadRequestException('没有可孵化的龙蛋');

    const metadata = item.metadataJson ? JSON.parse(item.metadataJson) : {};
    const species = metadata.species || 'dragon';

    // 扣减背包数量
    await this.prisma.inventory.update({
      where: { id: inventoryId },
      data: { quantity: { decrement: 1 } },
    });

    // 创建宠物
    const pet = await this.prisma.pet.create({
      data: { userId, species, name: name || `${species}宝宝`, stage: 'egg' },
    });

    return pet;
  }

  async feedPet(userId: string, petId: string, foodInventoryId: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet || pet.userId !== userId) throw new NotFoundException('宠物不存在');
    if (pet.stage === 'egg') throw new BadRequestException('龙蛋不需要喂食');

    const food = await this.prisma.inventory.findUnique({ where: { id: foodInventoryId } });
    if (!food || food.userId !== userId) throw new NotFoundException('食物不存在');
    if (food.itemType !== 'pet_food') throw new BadRequestException('这不是宠物食物');
    if (food.quantity < 1) throw new BadRequestException('食物已用完');

    await this.prisma.$transaction(async (tx) => {
      // 消耗食物
      await tx.inventory.update({
        where: { id: foodInventoryId },
        data: { quantity: { decrement: 1 } },
      });

      // 更新宠物
      await tx.pet.update({
        where: { id: petId },
        data: {
          hunger: Math.min(100, pet.hunger + 30),
          lastFedAt: new Date(),
          // 如果是从蛋孵化，推进阶段
          ...(pet.stage === 'egg' ? { stage: 'baby', hatchedAt: new Date() } : {}),
        },
      });
    });

    return { fed: true, message: `${pet.name} 吃饱了！` };
  }

  async growPet(userId: string, petId: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet || pet.userId !== userId) throw new NotFoundException('宠物不存在');

    // 模拟成长：喂食足够次数后可升级stage
    if (pet.stage === 'baby' && pet.hunger > 60) {
      await this.prisma.pet.update({
        where: { id: petId },
        data: { stage: 'adult', level: { increment: 1 } },
      });
      return { grown: true, stage: 'adult', message: `${pet.name} 长大了！现在是一只成年龙！` };
    }

    return { grown: false, message: `${pet.name} 还需要更多关爱才能成长` };
  }
}
