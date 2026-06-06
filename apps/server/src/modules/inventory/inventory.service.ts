import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getInventory(userId: string) {
    const items = await this.prisma.inventory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // 按类型分组
    const grouped: Record<string, any[]> = {};
    for (const item of items) {
      if (!grouped[item.itemType]) grouped[item.itemType] = [];
      grouped[item.itemType].push({
        id: item.id,
        itemType: item.itemType,
        itemId: item.itemId,
        quantity: item.quantity,
        metadata: item.metadataJson ? JSON.parse(item.metadataJson) : null,
        createdAt: item.createdAt,
      });
    }

    return grouped;
  }

  async useItem(userId: string, inventoryId: string) {
    const item = await this.prisma.inventory.findUnique({
      where: { id: inventoryId },
    });
    if (!item || item.userId !== userId) {
      throw new Error('物品不存在');
    }
    if (item.quantity <= 0) throw new Error('物品已用完');

    await this.prisma.inventory.update({
      where: { id: inventoryId },
      data: { quantity: { decrement: 1 } },
    });

    return { success: true, itemType: item.itemType };
  }
}
