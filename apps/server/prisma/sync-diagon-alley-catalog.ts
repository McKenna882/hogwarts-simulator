import { PrismaClient } from '@prisma/client';
import catalog from './diagon-alley-catalog.json';

const prisma = new PrismaClient();

const itemTypeMap: Record<string, string> = {
  BOOK: 'book',
  FOOD: 'food',
  PRANK: 'prank',
  QUIDDITCH: 'broom',
  DARK_ARTS: 'dark_arts',
  MISC: 'misc',
  PET: 'pet',
  ACCESSORY: 'accessory',
  POTION: 'potion',
};

const shopIconMap: Record<string, string> = {
  丽痕书店: '📚',
  弗洛林冷饮店: '🍨',
  韦斯莱笑话商店: '🎆',
  魁地奇精品店: '🧹',
  '博金-博克': '🕯️',
  破釜酒吧: '🍺',
  帕特奇坩埚店: '⚗️',
  神奇动物园: '🥚',
  摩金夫人长袍专卖店: '👗',
  '蜂蜜公爵（对角巷分店）': '🍬',
  '斯拉格·吉格斯药店': '🧪',
};

async function syncCatalog() {
  let shopSort = 1;
  let productCount = 0;

  for (const shop of catalog) {
    const existingShop = await prisma.shop.findFirst({ where: { name: shop.name } });
    const savedShop = existingShop
      ? await prisma.shop.update({
          where: { id: existingShop.id },
          data: {
            description: shop.description,
            icon: shopIconMap[shop.name] || shop.items[0]?.emoji || '🏪',
            sortOrder: shopSort,
          },
        })
      : await prisma.shop.create({
          data: {
            name: shop.name,
            description: shop.description,
            icon: shopIconMap[shop.name] || shop.items[0]?.emoji || '🏪',
            sortOrder: shopSort,
          },
        });

    let productSort = 1;
    for (const item of shop.items) {
      const itemType = itemTypeMap[item.category] || 'general';
      const payload = JSON.stringify({
        sourceId: item.id,
        category: item.category,
        emoji: item.emoji,
      });
      const existingProduct = await prisma.product.findFirst({
        where: {
          shopId: savedShop.id,
          name: item.name,
        },
      });

      const data = {
        description: item.description,
        priceGalleons: item.price,
        itemType,
        itemPayloadJson: payload,
        imageUrl: null,
        stock: null,
        limitPerUser: null,
        availableFrom: null,
        availableTo: null,
        isActive: true,
        sortOrder: productSort,
      };

      if (existingProduct) {
        await prisma.product.update({
          where: { id: existingProduct.id },
          data,
        });
      } else {
        await prisma.product.create({
          data: {
            shopId: savedShop.id,
            name: item.name,
            ...data,
          },
        });
      }

      productSort += 1;
      productCount += 1;
    }

    await prisma.product.updateMany({
      where: {
        shopId: savedShop.id,
        name: { notIn: shop.items.map((item) => item.name) },
      },
      data: { isActive: false },
    });

    shopSort += 1;
  }

  console.log(`对角巷商店同步完成：${catalog.length} 家店铺，${productCount} 个静态商品。`);
}

syncCatalog()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
