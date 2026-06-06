import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const GBP_PER_GALLEON = 12.35;

const exchangeTiers = [1, 3, 5, 10, 20].map((galleons, index) => ({
  name: `${galleons} 金加隆兑换`,
  amountCents: Math.round(galleons * GBP_PER_GALLEON * 100),
  galleons,
  bonusGalleons: 0,
  sortOrder: index + 1,
  isActive: true,
}));

async function main() {
  console.log('Generating Gringotts currency exchange tiers...');
  await prisma.rechargePackage.deleteMany();
  await prisma.rechargePackage.createMany({ data: exchangeTiers });

  const gringotts = await prisma.shop.findFirst({ where: { name: '古灵阁' } });
  if (gringotts) {
    await prisma.product.deleteMany({
      where: {
        shopId: gringotts.id,
        itemType: 'galleons',
      },
    });

    await prisma.product.createMany({
      data: [
        {
          shopId: gringotts.id,
          name: '100 金加隆兑换凭证',
          description: '古灵阁专用兑换凭证，可用于账户入账流程',
          priceGalleons: 0,
          itemType: 'galleons',
          itemPayloadJson: JSON.stringify({ amount: 100, exchangeRateGbp: GBP_PER_GALLEON }),
          stock: null,
          limitPerUser: null,
          sortOrder: 1,
        },
        {
          shopId: gringotts.id,
          name: '500 金加隆兑换凭证',
          description: '古灵阁专用兑换凭证，可用于账户入账流程',
          priceGalleons: 0,
          itemType: 'galleons',
          itemPayloadJson: JSON.stringify({ amount: 500, exchangeRateGbp: GBP_PER_GALLEON }),
          stock: null,
          limitPerUser: null,
          sortOrder: 2,
        },
      ],
    });
  }

  await prisma.walletTransaction.updateMany({
    where: { description: { contains: '金币包（小）' } },
    data: { description: '兑换 100 金加隆凭证' },
  });
  await prisma.walletTransaction.updateMany({
    where: { description: { contains: '金币包（中）' } },
    data: { description: '兑换 500 金加隆凭证' },
  });

  console.log(`Generated ${exchangeTiers.length} exchange tiers at GBP ${GBP_PER_GALLEON} per Galleon.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
