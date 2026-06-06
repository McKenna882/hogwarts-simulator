import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const LEGACY_DIAGON_ALLEY_SHOPS = [
  '涓界棔涔﹀簵',
  '寮楁礇鏋楀喎楗簵',
  '闊︽柉鑾辩瑧璇濆晢搴?',
  '榄佸湴濂囩簿鍝佸簵',
  '鍗氶噾-鍗氬厠',
  '鐮撮嚋閰掑惂',
  '甯曠壒濂囧潻鍩氬簵',
  '绁炲鍔ㄧ墿鍥?',
  '鎽╅噾澶汉闀胯涓撳崠搴?',
  '铚傝湝鍏埖锛堝瑙掑贩鍒嗗簵锛?',
  '鏂媺鏍悸峰悏鏍兼柉鑽簵',
];

const DIAGON_ALLEY_SHOPS = [
  ...LEGACY_DIAGON_ALLEY_SHOPS,
  '丽痕书店',
  '弗洛林冷饮店',
  '韦斯莱笑话商店',
  '韦斯莱魔法把戏坊',
  '魁地奇精品店',
  '博金-博克',
  '破釜酒吧',
  '帕特奇坩埚店',
  '神奇动物园',
  '摩金夫人长袍专卖店',
  '摩金夫人长袍店',
  '蜂蜜公爵（对角巷分店）',
  '蜂蜜公爵糖果店',
  '斯拉格·吉格斯药店',
  '奥利凡德魔杖店',
];

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  async getShops() {
    return this.prisma.shop.findMany({
      where: { name: { in: DIAGON_ALLEY_SHOPS } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getProducts(shopId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('商店不存在');

    return this.prisma.product.findMany({
      where: { shopId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async buyProduct(userId: string, productId: string, quantity = 1) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new BadRequestException('购买数量不正确');
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('商品不存在');
    if (!product.isActive) throw new BadRequestException('该商品已下架');

    const totalPrice = product.priceGalleons * quantity;

    if (product.stock !== null && product.stock < quantity) {
      throw new BadRequestException('库存不足');
    }

    if (product.limitPerUser) {
      const existingOrders = await this.prisma.order.count({
        where: { userId, productId },
      });
      if (existingOrders + quantity > product.limitPerUser) {
        throw new BadRequestException('超过限购数量');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balanceGalleons < totalPrice) {
        throw new BadRequestException(`余额不足，需要 ${totalPrice} G，当前 ${wallet?.balanceGalleons || 0} G`);
      }

      await tx.wallet.update({
        where: { userId },
        data: { balanceGalleons: { decrement: totalPrice } },
      });

      const order = await tx.order.create({
        data: { userId, productId, quantity, totalPrice, status: 'completed' },
      });

      if (product.stock !== null) {
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: quantity } },
        });
      }

      await tx.inventory.upsert({
        where: {
          userId_itemType_itemId: {
            userId,
            itemType: product.itemType || 'general',
            itemId: productId,
          },
        },
        update: { quantity: { increment: quantity } },
        create: {
          userId,
          itemType: product.itemType || 'general',
          itemId: productId,
          quantity,
          metadataJson: product.itemPayloadJson,
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          amount: -totalPrice,
          type: 'purchase',
          source: `购买 ${product.name}`,
          description: `购买了 ${quantity}x ${product.name}`,
          orderId: order.id,
        },
      });

      return { orderId: order.id, totalPrice, productName: product.name };
    });

    return result;
  }
}
