import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Archive, ArrowLeft, Coins, Package, ShoppingBag, Sparkles, Store, X } from 'lucide-react';
import { inventoryApi, shopApi, walletApi } from '../api/endpoints';
import { useUIStore } from '../stores/uiStore';
import { useUserStore } from '../stores/userStore';

type Shop = {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
};

type Product = {
  id: string;
  name: string;
  description?: string | null;
  priceGalleons: number;
  itemType?: string | null;
  itemPayloadJson?: string | null;
  imageUrl?: string | null;
  stock?: number | null;
  limitPerUser?: number | null;
};

type InventoryItem = {
  id: string;
  itemType?: string | null;
  itemId: string;
  quantity: number;
  metadataJson?: string | null;
  metadata?: Record<string, unknown> | null;
  product?: { name?: string | null } | null;
};

const BAD_ICON_PATTERN = /馃|鈿|鉁|锔|笍|�|\?/;

const ICON_FALLBACKS: Record<string, string> = {
  '🫘': '🍬',
  '🫧': '✨',
  '🪄': '✨',
  '🪳': '🍫',
};

const TYPE_EMOJIS: Record<string, string> = {
  galleons: '💰',
  pet_egg: '🐉',
  pet_food: '🥩',
  pet: '🐾',
  consumable: '🍬',
  food: '🍽️',
  book: '📚',
  wand: '✨',
  clothing: '👗',
  accessory: '💍',
  broom: '🧹',
  equipment: '🛡️',
  collectible: '🏆',
  potion: '🧪',
  dark_arts: '💀',
  prank: '🎁',
  misc: '📦',
  special: '✨',
  general: '📦',
};

const SHOP_STYLE_BY_ORDER: Record<number, { icon: string; gradient: string }> = {
  1: { icon: '📚', gradient: 'from-amber-900/80 to-amber-700/60' },
  2: { icon: '🍨', gradient: 'from-pink-700/80 to-purple-700/60' },
  3: { icon: '🎁', gradient: 'from-orange-700/80 to-red-700/60' },
  4: { icon: '🧹', gradient: 'from-red-900/80 to-yellow-700/60' },
  5: { icon: '🕯️', gradient: 'from-zinc-950/90 to-black/70' },
  6: { icon: '🍻', gradient: 'from-stone-800/90 to-orange-950/70' },
  7: { icon: '⚗️', gradient: 'from-stone-800/90 to-yellow-950/70' },
  8: { icon: '🐉', gradient: 'from-purple-900/80 to-pink-900/60' },
  9: { icon: '👗', gradient: 'from-blue-900/80 to-indigo-900/60' },
  10: { icon: '🍬', gradient: 'from-pink-700/80 to-emerald-700/60' },
  11: { icon: '🧪', gradient: 'from-emerald-900/80 to-teal-900/60' },
};

const SHOP_DISPLAY_BY_ORDER: Record<number, { name: string; description: string }> = {
  1: { name: '丽痕书店', description: '魔法书籍、教材与稀有手稿。' },
  2: { name: '弗洛林冷饮店', description: '冰淇淋、茶点与对角巷午后甜品。' },
  3: { name: '韦斯莱笑话商店', description: '恶作剧道具、烟火与整蛊玩意。' },
  4: { name: '魁地奇精品店', description: '飞天扫帚、护具与比赛装备。' },
  5: { name: '博金-博克', description: '翻倒巷深处的危险古董。' },
  6: { name: '破釜酒吧', description: '酒水、餐点与巫师旅店。' },
  7: { name: '帕特奇坩埚店', description: '坩埚、器皿与魔药工具。' },
  8: { name: '神奇动物园', description: '魔法宠物、龙蛋与喂养用品。' },
  9: { name: '摩金夫人长袍专卖店', description: '长袍、礼服与学院服饰。' },
  10: { name: '蜂蜜公爵（对角巷分店）', description: '魔法糖果、巧克力蛙与甜品。' },
  11: { name: '斯拉格·吉格斯药店', description: '魔药、草药与炼制材料。' },
};

const LEGACY_SHOP_STYLE: Array<{ tests: string[]; icon: string; gradient: string; name?: string; description?: string }> = [
  { tests: ['古灵阁'], icon: '🏦', gradient: 'from-zinc-950/90 to-yellow-900/60', name: '古灵阁' },
  { tests: ['神奇动物园'], icon: '🐉', gradient: 'from-purple-900/80 to-pink-900/60', name: '神奇动物园' },
  { tests: ['韦斯莱'], icon: '🎁', gradient: 'from-orange-700/80 to-red-700/60', name: '韦斯莱魔法把戏坊' },
  { tests: ['丽痕'], icon: '📚', gradient: 'from-amber-900/80 to-amber-700/60', name: '丽痕书店' },
  { tests: ['摩金'], icon: '👗', gradient: 'from-blue-900/80 to-indigo-900/60', name: '摩金夫人长袍店' },
  { tests: ['奥利凡德'], icon: '✨', gradient: 'from-stone-800/90 to-yellow-950/70', name: '奥利凡德魔杖店' },
  { tests: ['蜂蜜公爵'], icon: '🍬', gradient: 'from-pink-700/80 to-emerald-700/60', name: '蜂蜜公爵糖果店' },
  { tests: ['魁地奇'], icon: '🧹', gradient: 'from-red-900/80 to-yellow-700/60', name: '魁地奇精品店' },
];

const PRODUCT_ICON_RULES: Array<{ tests: string[]; icon: string }> = [
  { tests: ['比比多味豆', 'every_flavour_beans', 'bertie_botts'], icon: '🍬' },
  { tests: ['巧克力蛙', 'chocolate_frog'], icon: '🐸' },
  { tests: ['南瓜汁', 'pumpkin_juice'], icon: '🎃' },
  { tests: ['黄油啤酒', 'butterbeer'], icon: '🍺' },
  { tests: ['甘草魔杖', 'licorice_wand', 'licorice_wands'], icon: '🍭' },
  { tests: ['酸味爆爆糖', 'acid_pops'], icon: '🍬' },
  { tests: ['血味棒棒糖', 'blood_pop'], icon: '🩸' },
  { tests: ['滋滋蜂蜜糖'], icon: '🍯' },
  { tests: ['吹宝', '泡泡糖', 'drooble_gum'], icon: '✨' },
  { tests: ['蟑螂堆', 'cockroach_clusters'], icon: '🍫' },
  { tests: ['魔杖', 'wand'], icon: '✨' },
  { tests: ['长袍', '礼服', '舞裙', '围巾', 'robe', 'dress', 'scarf'], icon: '👗' },
  { tests: ['扫帚', '光轮', '火弩箭', 'broom', 'nimbus'], icon: '🧹' },
  { tests: ['药', '魔药', 'potion'], icon: '🧪' },
  { tests: ['书', '教材', 'book', 'textbook'], icon: '📚' },
  { tests: ['龙蛋', '宠物', '猫头鹰', '蟾蜍', 'pet'], icon: '🐉' },
  { tests: ['兑换凭证', '金加隆', 'galleons'], icon: '💰' },
];

const parsePayload = (value?: string | null) => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const normalizeType = (type?: string | null) => (type || 'general').toLowerCase();

const normalizeInventory = (value: unknown): InventoryItem[] => {
  if (Array.isArray(value)) return value as InventoryItem[];
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((items) =>
      Array.isArray(items) ? (items as InventoryItem[]) : [],
    );
  }
  return [];
};

const isUsableIcon = (value?: string | null) => {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 8 && !BAD_ICON_PATTERN.test(trimmed);
};

const normalizeVisualIcon = (value?: string | null) => {
  if (!isUsableIcon(value)) return null;
  const trimmed = value!.trim();
  return ICON_FALLBACKS[trimmed] || trimmed;
};

const includesAny = (text: string, tests: string[]) => tests.some((test) => text.includes(test));

const getShopStyle = (shop: Shop) => {
  const byName = LEGACY_SHOP_STYLE.find((entry) => includesAny(shop.name, entry.tests));
  if (byName) return byName;
  if (typeof shop.sortOrder === 'number' && SHOP_STYLE_BY_ORDER[shop.sortOrder]) {
    return SHOP_STYLE_BY_ORDER[shop.sortOrder];
  }
  return {
    icon: normalizeVisualIcon(shop.icon) || '🏪',
    gradient: 'from-hogwarts-bg/90 to-black/50',
  };
};

const getShopDisplay = (shop: Shop) => {
  const byName = LEGACY_SHOP_STYLE.find((entry) => includesAny(shop.name, entry.tests));
  const byOrder = typeof shop.sortOrder === 'number' ? SHOP_DISPLAY_BY_ORDER[shop.sortOrder] : undefined;
  return {
    name: byName?.name || byOrder?.name || shop.name,
    description: byName?.description || byOrder?.description || shop.description || '欢迎光临，请挑选您需要的商品。',
  };
};

const getProductIcon = (product: Product) => {
  const payload: any = parsePayload(product.itemPayloadJson);
  const haystack = [
    product.name,
    product.description,
    product.itemType,
    payload.type,
    payload.category,
    payload.candyType,
    payload.drinkType,
    payload.model,
    payload.sourceId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const rule = PRODUCT_ICON_RULES.find((entry) => includesAny(haystack, entry.tests.map((test) => test.toLowerCase())));
  if (rule) return rule.icon;
  return normalizeVisualIcon(payload.emoji) || TYPE_EMOJIS[normalizeType(product.itemType)] || TYPE_EMOJIS.general;
};

function ProductIcon({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (product.imageUrl && !imageFailed) {
    return (
      <img
        src={product.imageUrl}
        alt=""
        className="h-9 w-9 rounded-md object-contain"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <>{getProductIcon(product)}</>;
}

export default function DiagonAlley() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showInventory, setShowInventory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const balance = useUserStore((s) => s.profile?.wallet?.balanceGalleons ?? 0);
  const updateWalletBalance = useUserStore((s) => s.updateWalletBalance);
  const showToast = useUIStore((s) => s.showToast);

  const inventoryByType = useMemo(() => {
    const grouped: Record<string, InventoryItem[]> = {};
    for (const item of inventory) {
      const type = normalizeType(item.itemType);
      grouped[type] = grouped[type] || [];
      grouped[type].push(item);
    }
    return grouped;
  }, [inventory]);

  const totalInventory = useMemo(
    () => inventory.reduce((sum, item) => sum + item.quantity, 0),
    [inventory],
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shopsRes, inventoryRes] = await Promise.all([
        shopApi.getShops(),
        inventoryApi.getInventory(),
      ]);
      setShops(shopsRes.data);
      setInventory(normalizeInventory(inventoryRes.data));
    } catch (error) {
      console.error('加载对角巷数据失败', error);
      showToast('加载对角巷失败，请稍后重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectShop = async (shop: Shop) => {
    setSelectedShop(shop);
    setProducts([]);
    setProductsLoading(true);
    try {
      const res = await shopApi.getProducts(shop.id);
      setProducts(res.data);
    } catch (error) {
      console.error('加载商品失败', error);
      showToast('这家店的货架暂时打不开', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  const refreshAfterPurchase = async () => {
    const [walletRes, inventoryRes] = await Promise.all([
      walletApi.getWallet(),
      inventoryApi.getInventory(),
    ]);
    updateWalletBalance(walletRes.data.balanceGalleons);
    setInventory(normalizeInventory(inventoryRes.data));
    if (selectedShop) {
      const productsRes = await shopApi.getProducts(selectedShop.id);
      setProducts(productsRes.data);
    }
  };

  const buy = async (product: Product, quantity = 1) => {
    setBuyingId(`${product.id}:${quantity}`);
    try {
      const res = await shopApi.buyProduct(product.id, quantity);
      showToast(`购买成功：${quantity}x ${res.data.productName}`, 'success');
      await refreshAfterPurchase();
    } catch (err: any) {
      showToast(err.response?.data?.message || '购买失败', 'error');
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-hogwarts-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.06]" />

      <div className="relative mb-5 flex flex-col gap-4 border-b border-hogwarts-goldDark/20 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-hogwarts-gold/70">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.24em]">Diagon Alley</span>
          </div>
          <h1 className="mt-2 font-magical text-2xl tracking-widest text-hogwarts-gold md:text-3xl">对角巷</h1>
          <p className="mt-1 text-sm font-serif italic text-hogwarts-paper/45">点击店铺进入购买</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-hogwarts-gold/25 bg-black/25 px-4 py-2">
            <div className="flex items-center gap-2 text-hogwarts-gold">
              <Coins className="h-4 w-4" />
              <span className="font-magical text-lg">{balance} G</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-hogwarts-paper/35">Gringotts Vault</p>
          </div>
          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-hogwarts-gold/35 bg-hogwarts-bg/80 text-hogwarts-gold transition-colors hover:bg-hogwarts-gold/10"
            onClick={() => setShowInventory(true)}
            aria-label="打开背包"
            title="背包"
          >
            <Archive className="h-5 w-5" />
            {totalInventory > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-hogwarts-gold px-1 text-[10px] font-bold text-black">
                {totalInventory}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="relative grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          {shops.map((shop) => {
            const selected = selectedShop?.id === shop.id;
            const style = getShopStyle(shop);
            const display = getShopDisplay(shop);
            return (
              <motion.button
                key={shop.id}
                type="button"
                className={`group relative w-full overflow-hidden rounded-lg border p-4 text-left transition-all ${
                  selected
                    ? 'border-hogwarts-gold/70 shadow-[0_0_22px_rgba(197,160,89,0.16)]'
                    : 'border-hogwarts-goldDark/30 hover:border-hogwarts-gold/45'
                } ${
                  selected
                    ? `bg-gradient-to-br ${style.gradient}`
                    : 'bg-hogwarts-bg/80'
                }`}
                onClick={() => selectShop(shop)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="absolute inset-0 bg-black/25" />
                <div className="relative flex gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/25 text-2xl transition-transform group-hover:scale-105">
                    {style.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-magical text-lg tracking-wider text-gray-100">{display.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs font-serif italic leading-5 text-hogwarts-paper/60">
                      {display.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </aside>

        <section className="min-h-[420px] rounded-lg border border-hogwarts-goldDark/30 bg-hogwarts-bg/75 p-3 backdrop-blur-sm md:p-5 xl:min-h-[520px]">
          {!selectedShop ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
              <Store className="h-12 w-12 text-hogwarts-gold/60" />
              <h2 className="mt-4 font-magical text-2xl tracking-widest text-hogwarts-gold">请在左侧选择一家商店</h2>
              <p className="mt-2 max-w-sm text-sm font-serif italic leading-6 text-hogwarts-paper/45">
                商品会以卡片形式展示，支持单件购买和批量购买。
              </p>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="mb-4 inline-flex items-center gap-2 text-sm text-hogwarts-paper/45 transition-colors hover:text-hogwarts-gold xl:hidden"
                onClick={() => setSelectedShop(null)}
              >
                <ArrowLeft className="h-4 w-4" />
                返回店铺列表
              </button>

              <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-hogwarts-gold/20 bg-black/25 text-2xl">
                    {getShopStyle(selectedShop).icon}
                  </div>
                  <div>
                    <h2 className="font-magical text-2xl tracking-widest text-white">{getShopDisplay(selectedShop).name}</h2>
                    <p className="mt-1 text-sm font-serif italic text-hogwarts-paper/45">
                      {getShopDisplay(selectedShop).description}
                    </p>
                  </div>
                </div>
                <Sparkles className="mt-1 hidden h-5 w-5 text-hogwarts-gold/50 sm:block" />
              </div>

              {productsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-hogwarts-gold border-t-transparent" />
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-lg border border-dashed border-hogwarts-goldDark/30 py-12 text-center font-serif italic text-hogwarts-paper/40">
                  这家店暂时没有商品。
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => {
                    const payload: any = parsePayload(product.itemPayloadJson);
                    const totalBulkPrice = product.priceGalleons * 5;
                    const outOfStock = product.stock === 0;
                    const canBuy = !outOfStock && product.priceGalleons <= balance;
                    const canBulk =
                      !outOfStock &&
                      totalBulkPrice <= balance &&
                      (product.stock === null || product.stock === undefined || product.stock >= 5);

                    return (
                      <motion.article
                        key={product.id}
                        className="relative flex min-h-[230px] flex-col rounded-lg border border-hogwarts-goldDark/30 bg-black/20 p-4 transition-all hover:border-hogwarts-gold/45 hover:shadow-[0_0_18px_rgba(197,160,89,0.12)]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-3xl">
                            <ProductIcon product={product} />
                          </div>
                          <div className="rounded-md border border-hogwarts-gold/25 bg-hogwarts-gold/10 px-2 py-1 font-magical text-sm text-hogwarts-gold">
                            {product.priceGalleons} G
                          </div>
                        </div>

                        <h3 className="mt-3 font-magical text-lg leading-snug tracking-wider text-hogwarts-gold">
                          {product.name}
                        </h3>
                        <p className="mt-2 line-clamp-3 flex-1 text-xs leading-5 text-hogwarts-paper/55">
                          {product.description || '暂无商品说明。'}
                        </p>

                        {(payload.charm || payload.speed) && (
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                            {payload.charm && (
                              <span className="rounded-full bg-pink-500/10 px-2 py-1 text-pink-200">魅力 +{payload.charm}</span>
                            )}
                            {payload.speed && (
                              <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-200">速度 +{payload.speed}%</span>
                            )}
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between text-[11px] text-hogwarts-paper/35">
                          <span>{product.stock === null || product.stock === undefined ? '库存充足' : `库存 ${product.stock}`}</span>
                          {product.limitPerUser && <span>限购 {product.limitPerUser}</span>}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-hogwarts-gold px-3 py-2 text-sm font-bold text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
                            onClick={() => buy(product)}
                            disabled={!canBuy || buyingId !== null}
                          >
                            <ShoppingBag className="h-4 w-4" />
                            {outOfStock ? '已售罄' : product.priceGalleons > balance ? '余额不足' : '购买'}
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-hogwarts-gold/35 px-3 py-2 text-sm font-bold text-hogwarts-gold transition-colors hover:bg-hogwarts-gold/10 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-500"
                            onClick={() => buy(product, 5)}
                            disabled={!canBulk || buyingId !== null}
                            title="一次购买 5 件"
                          >
                            <Package className="h-4 w-4" />
                            批发
                          </button>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <AnimatePresence>
        {showInventory && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInventory(false)}
          >
            <motion.div
              className="max-h-[82vh] w-full max-w-2xl overflow-y-auto rounded-lg border-4 border-amber-800/80 bg-[#f4e4d0] bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] p-6 shadow-[0_0_40px_rgba(255,200,0,0.25)]"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between border-b-2 border-amber-900/20 pb-3">
                <div>
                  <h3 className="font-magical text-xl tracking-wider text-amber-900">我的背包</h3>
                  <p className="mt-1 text-xs font-serif italic text-amber-900/50">购买后的物品会存放在这里。</p>
                </div>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-900/15 text-amber-900 transition-colors hover:bg-amber-900/30"
                  onClick={() => setShowInventory(false)}
                  aria-label="关闭背包"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {Object.keys(inventoryByType).length === 0 ? (
                <p className="py-8 text-center font-serif italic text-amber-900/50">背包还是空的。</p>
              ) : (
                <div className="space-y-5">
                  {Object.entries(inventoryByType).map(([type, items]) => (
                    <section key={type}>
                      <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-900/45">{type}</div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {items.map((item) => {
                          const meta: any = item.metadata || parsePayload(item.metadataJson);
                          const label =
                            meta.name ||
                            meta.dragonType ||
                            meta.model ||
                            meta.wood ||
                            item.product?.name ||
                            item.itemId.slice(0, 8);
                          return (
                            <div
                              key={item.id}
                              className="rounded-lg border border-amber-300/50 bg-amber-50/65 p-3 text-center shadow-sm"
                            >
                              <div className="mb-1 text-xl">{TYPE_EMOJIS[type] || TYPE_EMOJIS.general}</div>
                              <p className="truncate text-xs font-serif text-amber-900/75">{label}</p>
                              <p className="mt-1 font-magical text-xs text-amber-700">x{item.quantity}</p>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
