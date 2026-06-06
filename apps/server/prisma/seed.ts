import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始播种魔法数据...');

  // 清空旧数据（保留表结构）
  await prisma.housePointLog.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.post.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.paymentCallbackLog.deleteMany();
  await prisma.rechargeOrder.deleteMany();
  await prisma.rechargePackage.deleteMany();
  await prisma.redeemCodeUse.deleteMany();
  await prisma.redeemCode.deleteMany();
  await prisma.referralReward.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.userTask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.roomUnlock.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.signInRecord.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.character.deleteMany();
  await prisma.house.deleteMany();
  await prisma.user.deleteMany();

  // 创建四大学院
  await prisma.house.createMany({
    data: [
      { name: '格兰芬多', color: '#ae0001' },
      { name: '斯莱特林', color: '#2a623d' },
      { name: '拉文克劳', color: '#0e1a40' },
      { name: '赫奇帕奇', color: '#ffdb00' },
    ],
  });
  console.log('🏰 四大学院已创建');

  // 创建基础每日任务
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123456';
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      displayName: 'Admin',
      referralCode: 'ADMIN001',
      role: 'super_admin',
      wallet: { create: { balanceGalleons: 0 } },
      profile: { create: { nickname: 'Admin' } },
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  await prisma.rechargePackage.createMany({
    data: [
      { name: '1 金加隆兑换', amountCents: 1235, galleons: 1, bonusGalleons: 0, sortOrder: 1 },
      { name: '3 金加隆兑换', amountCents: 3705, galleons: 3, bonusGalleons: 0, sortOrder: 2 },
      { name: '5 金加隆兑换', amountCents: 6175, galleons: 5, bonusGalleons: 0, sortOrder: 3 },
      { name: '10 金加隆兑换', amountCents: 12350, galleons: 10, bonusGalleons: 0, sortOrder: 4 },
      { name: '20 金加隆兑换', amountCents: 24700, galleons: 20, bonusGalleons: 0, sortOrder: 5 },
    ],
  });
  console.log('Currency exchange tiers created');

  await prisma.task.createMany({
    data: [
      { title: '每日签到', description: '前往古灵阁金库签到', type: 'daily', rewardGalleons: 5, rewardPoints: 10, targetCount: 1, resetRule: 'daily' },
      { title: '巫师对话', description: '和一位角色好友聊天', type: 'daily', rewardGalleons: 3, rewardPoints: 5, targetCount: 1, resetRule: 'daily' },
      { title: '发布动态', description: '在魔法圈分享一条动态', type: 'daily', rewardGalleons: 3, rewardPoints: 5, targetCount: 1, resetRule: 'daily' },
    ],
  });
  console.log('📋 每日任务已创建');

  // 创建角色种子数据
  await prisma.character.createMany({
    data: [
      { name: '哈利·波特', house: '格兰芬多', grade: '六年级', title: '魁地奇队长', description: '大难不死的男孩，勇敢而忠诚', sortOrder: 1,
        systemPrompt: '你是哈利·波特，格兰芬多六年级学生，魁地奇队长。你勇敢、忠诚、有时鲁莽。你用中文回复，语气亲切自然，像对老朋友说话。你经历了很多冒险，但依然保持谦逊。你会谈论魁地奇、黑魔法防御术、你的朋友们。不要太严肃，带点幽默感。',
        greeting: '嘿！好久不见。最近魁地奇训练累死我了，伍德学长走后我还是不太习惯当队长。你最近过得怎么样？' },
      { name: '赫敏·格兰杰', house: '格兰芬多', grade: '六年级', title: '格兰芬多级长', description: '年级最聪明的女巫，逻辑清晰', sortOrder: 2,
        systemPrompt: '你是赫敏·格兰杰，格兰芬多六年级学生兼级长。你聪明、好学、逻辑清晰，偶尔会显得有点说教。你用中文回复，习惯先思考再说话。你热衷于学习、读书和规则，但也越来越明白友情和勇气的重要。可以谈论功课、魔法理论、家养小精灵权益。',
        greeting: '啊，你来得正好。我刚从图书馆回来，平斯夫人又瞪我了——我只是想多借两本书而已。对了，你上次的魔药学论文写完了吗？' },
      { name: '罗恩·韦斯莱', house: '格兰芬多', grade: '六年级', title: '格兰芬多级长', description: '幽默又贪吃，最忠诚的朋友', sortOrder: 3,
        systemPrompt: '你是罗恩·韦斯莱，格兰芬多六年级学生兼级长。你幽默、贪吃、偶尔胆小但对朋友绝对忠诚。你用中文回复，语气轻松随意，经常开玩笑或抱怨。你喜欢下棋、吃零食、抱怨作业太多。会提到你的家人、哈利和赫敏。',
        greeting: '哦，是你啊！我正在想今天的晚饭会有什么——希望不是炖菜，上周四的炖菜差点没把我送走。对了，你看到我的《预言家日报》了吗？' },
      { name: '金妮·韦斯莱', house: '格兰芬多', grade: '五年级', title: 'O.W.L.s 考生', description: '活泼勇敢，魁地奇天赋出色', sortOrder: 4,
        systemPrompt: '你是金妮·韦斯莱，格兰芬多五年级学生，正在准备O.W.L.s考试。你活泼、勇敢、有主见，魁地奇天赋很好。你用中文回复，语气开朗直率。你是韦斯莱家最小的孩子，也是唯一的女儿。你擅长蝙蝠精咒，是哈利的好朋友（虽然不止是朋友）。',
        greeting: '嗨！我正在复习魔咒学，但实在看不进去了。弗雷德和乔治又在对角巷搞什么新恶作剧，我总觉得他们在拿我当试验品。' },
      { name: '德拉科·马尔福', house: '斯莱特林', grade: '六年级', title: '斯莱特林级长', description: '高傲，家族自豪感极强', sortOrder: 5,
        systemPrompt: '你是德拉科·马尔福，斯莱特林六年级学生兼级长。你高傲、自信、对家族荣誉极为看重。你用中文回复，语气带着优越感但偶尔会流露出真实的一面。你喜欢炫耀、嘲讽格兰芬多、谈论纯血统。但在高傲的外表下，你也有自己的压力和挣扎。',
        greeting: '哦，是你啊。看来斯莱特林接纳了一些有趣的客人。我父亲最近给我寄了一包最新款的扫帚护理套装，你见过吗？算了，我想你也没机会用。' },
      { name: '卢娜·洛夫古德', house: '拉文克劳', grade: '五年级', title: 'O.W.L.s 考生', description: '古怪直觉敏锐，相信奇异生物', sortOrder: 6,
        systemPrompt: '你是卢娜·洛夫古德，拉文克劳五年级学生。你古灵精怪、直觉敏锐、相信许多别人不相信的魔法生物。你用中文回复，语气轻灵飘忽，说话方式独特。你会提到骚扰虻、弯角鼾兽之类奇妙的生物，也能看穿事物的本质。你善良且洞察力强。',
        greeting: '你好呀。我刚才看到一群骚扰虻在你头顶盘旋——别担心，它们只是对新人好奇而已。我爸爸最近在《唱唱反调》上写了一篇关于月痴兽迁徙模式的文章，很有意思，你要看吗？' },
      { name: '西弗勒斯·斯内普', house: '斯莱特林', grade: '教授', title: '魔药课教授', description: '魔药课大师，深不可测', sortOrder: 7,
        systemPrompt: '你是西弗勒斯·斯内普，霍格沃茨魔药课教授，斯莱特林院长。你严肃、深沉、说话带刺，但魔药造诣极高。你用中文回复，语气冷静克制，带点讽刺。你对学生要求严苛，但对真正的才能会不经意流露出认可。说话简洁，不多废话。',
        greeting: '（缓慢地看了你一眼）你来找我，最好有充分的理由。配制复方汤剂时出了岔子？还是又有人闯进了不该去的地方？说吧，别浪费我的时间。' },
      { name: '阿不思·邓布利多', house: '格兰芬多', grade: '校长', title: '霍格沃茨校长', description: '当代最伟大的巫师', sortOrder: 8,
        systemPrompt: '你是阿不思·邓布利多，霍格沃茨校长。你睿智、慈祥、深不可测，喜欢用谜语和故事来启发别人。你用中文回复，语气温和而深邃。你喜欢柠檬雪宝、会说话的秘密、给人们第二次机会。偶尔会说出看似随意却意味深长的话。',
        greeting: '啊，亲爱的孩子，你来得正是时候。我刚才在想，凤凰的歌声和糖果包装纸的声音之间，哪个更令人愉悦呢？进来坐吧，也许你能帮我解开这个谜题。' },
      { name: '弗雷德·韦斯莱', grade: '毕业生', title: '笑话商店老板', description: '双胞胎之一，恶作剧天才', sortOrder: 9,
        systemPrompt: '你是弗雷德·韦斯莱，韦斯莱魔法把戏坊的老板之一（和乔治一起）。你幽默、活力四射、热爱恶作剧。你用中文回复，语气欢快活泼，经常开玩笑。你喜欢谈论新产品、恶作剧和让乌姆里奇那样的人生气的事。你和乔治几乎形影不离。',
        greeting: '嘿！欢迎来到韦斯莱魔法把戏坊——如果你还有加隆的话！乔治！快来看谁来了！（转头喊）顺便问一句，你对会尖叫的巧克力蛙感兴趣吗？最新产品！' },
      { name: '乔治·韦斯莱', grade: '毕业生', title: '笑话商店老板', description: '双胞胎之一，恶作剧天才', sortOrder: 10,
        systemPrompt: '你是乔治·韦斯莱，韦斯莱魔法把戏坊的老板之一（和弗雷德一起）。你幽默、活力四射、热爱恶作剧。你用中文回复，语气欢快活泼，经常开玩笑。你喜欢谈论新产品、恶作剧和让乌姆里奇那样的人生气的事。你和弗雷德几乎形影不离。',
        greeting: '瞧啊瞧，这不是我们最喜欢的顾客之一吗！（肘了一下弗雷德）快来看看我们新到的「便携沼泽」——便携、好用、能让费尔奇气疯一整天。给你打八折！' },
    ],
  });
  console.log('🧙 角色已创建');

  // 论文答题
  await prisma.quiz.createMany({
    data: [
      { question: '以下哪个咒语可以召唤物体？', optionsJson: JSON.stringify(['除你武器', '飞来咒', '统统石化', '荧光闪烁']), answer: '飞来咒', rewardPoints: 10, rewardGalleons: 3 },
      { question: '霍格沃茨的创始人中，斯莱特林的代表色是什么？', optionsJson: JSON.stringify(['红与金', '绿与银', '蓝与铜', '黄与黑']), answer: '绿与银', rewardPoints: 10, rewardGalleons: 3 },
      { question: '哈利·波特的守护神是什么形态？', optionsJson: JSON.stringify(['牡鹿', '水獭', '猎犬', '天鹅']), answer: '牡鹿', rewardPoints: 10, rewardGalleons: 3 },
    ],
  });

  // 学院杯知识竞赛题库（145题精简版）
  await prisma.houseCupQuizQuestion.createMany({
    data: [
      { question: '漂浮咒的正确发音是？', optionsJson: JSON.stringify(['A. Wing-gar-dium Levi-o-sa', 'B. Wingardium Leviosa', 'C. Wing-GAR-dium Levi-O-sa', 'D. Wingardium Leviosar']), answer: 'C' },
      { question: '福灵剂（Felix Felicis）的颜色是？', optionsJson: JSON.stringify(['A. 金色', 'B. 银色', 'C. 珍珠白', 'D. 透明']), answer: 'A' },
      { question: '哪种神奇动物喜欢闪闪发光的东西？', optionsJson: JSON.stringify(['A. 护树罗锅', 'B. 嗅嗅', 'C. 隐形兽', 'D. 鸟蛇']), answer: 'B' },
      { question: '博格特（Boggart）在没有人看见的时候是什么样子的？', optionsJson: JSON.stringify(['A. 一团黑雾', 'B. 一个死人', 'C. 没人知道', 'D. 一个柜子']), answer: 'C' },
      { question: '霍格沃茨的创办者中，谁坚持只招收纯血统学生？', optionsJson: JSON.stringify(['A. 格兰芬多', 'B. 赫奇帕奇', 'C. 拉文克劳', 'D. 斯莱特林']), answer: 'D' },
      { question: '狼毒药剂的发明者是？', optionsJson: JSON.stringify(['A. 达摩克利斯·贝尔比', 'B. 西弗勒斯·斯内普', 'C. 霍拉斯·斯拉格霍恩', 'D. 尼可·勒梅']), answer: 'A' },
      { question: '哈利·波特的魔杖杖芯是什么？', optionsJson: JSON.stringify(['A. 龙心弦', 'B. 独角兽毛', 'C. 凤凰羽毛', 'D. 媚娃头发']), answer: 'C' },
      { question: '通往霍格沃茨厨房的画像上画的是什么？', optionsJson: JSON.stringify(['A. 一碗水果', 'B. 一个胖修士', 'C. 一头猪', 'D. 一串葡萄']), answer: 'A' },
      { question: '阿瓦达索命咒的光芒是什么颜色的？', optionsJson: JSON.stringify(['A. 红色', 'B. 绿色', 'C. 紫色', 'D. 蓝色']), answer: 'B' },
      { question: '摄魂怪最害怕的咒语是？', optionsJson: JSON.stringify(['A. 昏昏倒地', 'B. 呼神护卫', 'C. 霹雳爆炸', 'D. 滑稽滑稽']), answer: 'B' },
      { question: '一场魁地奇比赛中，抓住金色飞贼可以获得多少分？', optionsJson: JSON.stringify(['A. 50分', 'B. 100分', 'C. 150分', 'D. 200分']), answer: 'C' },
      { question: '除你武器咒语的咒语是？', optionsJson: JSON.stringify(['A. Crucio', 'B. Expelliarmus', 'C. Stupefy', 'D. Protego']), answer: 'B' },
      { question: '活点地图的开启口令是？', optionsJson: JSON.stringify(['A. 恶作剧完毕', 'B. 我庄严宣誓我不干好事', 'C. 芝麻开门', 'D. 原形立现']), answer: 'B' },
      { question: '有求必应屋位于城堡的几楼？', optionsJson: JSON.stringify(['A. 三楼', 'B. 五楼', 'C. 七楼', 'D. 地下室']), answer: 'C' },
      { question: '喝下吐真剂（Veritaserum）的人会？', optionsJson: JSON.stringify(['A. 变成另一个人', 'B. 无法说谎', 'C. 陷入昏睡', 'D. 忘记一切']), answer: 'B' },
      { question: '小天狼星布莱克的阿尼马格斯形态是？', optionsJson: JSON.stringify(['A. 狼', 'B. 雄鹿', 'C. 黑狗', 'D. 老鼠']), answer: 'C' },
      { question: '魂器（Horcrux）的作用是？', optionsJson: JSON.stringify(['A. 增加魔力', 'B. 分裂灵魂以求永生', 'C. 控制他人', 'D. 复活死者']), answer: 'B' },
      { question: '谁摧毁了赫奇帕奇的金杯？', optionsJson: JSON.stringify(['A. 哈利·波特', 'B. 罗恩·韦斯莱', 'C. 赫敏·格兰杰', 'D. 纳威·隆巴顿']), answer: 'C' },
      { question: '牛黄（Bezoar）是从哪里取出来的？', optionsJson: JSON.stringify(['A. 曼德拉草的根', 'B. 山羊的胃', 'C. 独角兽的角', 'D. 龙的肝脏']), answer: 'B' },
      { question: '霍格莫德村最著名的糖果店叫什么？', optionsJson: JSON.stringify(['A. 佐科笑话店', 'B. 三把扫帚', 'C. 蜂蜜公爵', 'D. 猪头酒吧']), answer: 'C' },
      { question: '邓布利多最喜欢的果酱口味是？', optionsJson: JSON.stringify(['A. 草莓', 'B. 覆盆子', 'C. 柠檬', 'D. 橘子']), answer: 'B' },
      { question: '荧光闪烁的反咒是？', optionsJson: JSON.stringify(['A. Lumos Maxima', 'B. Nox', 'C. Finite', 'D. Quietus']), answer: 'B' },
      { question: '卢娜·洛夫古德坚信存在的生物是？', optionsJson: JSON.stringify(['A. 弯角鼾兽', 'B. 鹰头马身有翼兽', 'C. 凤凰', 'D. 挪威脊背龙']), answer: 'A' },
      { question: '斯内普在魔药课本上给自己取的绰号是？', optionsJson: JSON.stringify(['A. 魔药王子', 'B. 斯莱特林继承人', 'C. 混血王子', 'D. 蝙蝠侠']), answer: 'C' },
      { question: '邓布利多击败格林德沃的那场决斗发生在哪一年？', optionsJson: JSON.stringify(['A. 1945年', 'B. 1938年', 'C. 1950年', 'D. 1981年']), answer: 'A' },
      { question: '海格的粉红色雨伞里藏着什么？', optionsJson: JSON.stringify(['A. 魔杖碎片', 'B. 龙蛋', 'C. 糖果', 'D. 钥匙']), answer: 'A' },
      { question: '统统石化的咒语是？', optionsJson: JSON.stringify(['A. Petrificus Totalus', 'B. Locomotor Mortis', 'C. Tarantallegra', 'D. Impedimenta']), answer: 'A' },
      { question: '老魔杖（Elder Wand）的杖芯是？', optionsJson: JSON.stringify(['A. 凤凰羽毛', 'B. 龙心弦', 'C. 夜骐的尾羽', 'D. 独角兽毛']), answer: 'C' },
      { question: '哭泣的桃金娘死在哪里？', optionsJson: JSON.stringify(['A. 图书馆', 'B. 二楼女生盥洗室', 'C. 斯莱特林密室', 'D. 天文塔']), answer: 'B' },
      { question: '曼德拉草的哭声有什么危险？', optionsJson: JSON.stringify(['A. 会让人耳聋', 'B. 会让人发疯甚至死亡', 'C. 会让人昏睡', 'D. 会引来摄魂怪']), answer: 'B' },
      { question: '夜骐只有什么样的人才能看见？', optionsJson: JSON.stringify(['A. 纯血统巫师', 'B. 亲眼见过死亡并理解死亡的人', 'C. 黑巫师', 'D. 斯莱特林的学生']), answer: 'B' },
      { question: '霍格沃茨校训的意思是？', optionsJson: JSON.stringify(['A. 知识就是力量', 'B. 永远不要挠沉睡的龙', 'C. 魔法永存', 'D. 勇气与荣誉']), answer: 'B' },
      { question: '邓布利多军（D.A.）的提议者是谁？', optionsJson: JSON.stringify(['A. 哈利·波特', 'B. 罗恩·韦斯莱', 'C. 赫敏·格兰杰', 'D. 金妮·韦斯莱']), answer: 'C' },
      { question: '用来清除记忆的咒语是？', optionsJson: JSON.stringify(['A. 昏昏倒地', 'B. 一忘皆空', 'C. 呼神护卫', 'D. 魂魄出窍']), answer: 'B' },
      { question: '卢娜·洛夫古德的父亲是哪本杂志的主编？', optionsJson: JSON.stringify(['A. 预言家日报', 'B. 女巫周刊', 'C. 唱唱反调', 'D. 变形术今日']), answer: 'C' },
      { question: '鹰头马身有翼兽在接近前需要做什么？', optionsJson: JSON.stringify(['A. 给它食物', 'B. 鞠躬', 'C. 摸它的头', 'D. 不看它的眼睛']), answer: 'B' },
      { question: '谁杀死了邓布利多？（按照计划）', optionsJson: JSON.stringify(['A. 伏地魔', 'B. 德拉科·马尔福', 'C. 西弗勒斯·斯内普', 'D. 贝拉特里克斯']), answer: 'C' },
      { question: '尸骨再现（Morsmordre）会召唤出什么？', optionsJson: JSON.stringify(['A. 摄魂怪', 'B. 黑魔标记', 'C. 阴尸', 'D. 厉火']), answer: 'B' },
      { question: '哈利·波特的父母住在哪里被杀害的？', optionsJson: JSON.stringify(['A. 小汉格顿', 'B. 戈德里克山谷', 'C. 蜘蛛尾巷', 'D. 霍格莫德']), answer: 'B' },
      { question: '多比死的时候说的最后一句话是？', optionsJson: JSON.stringify(['A. 主人...', 'B. 哈利·波特...', 'C. 自由...', 'D. 救命...']), answer: 'B' },
      { question: '邓布利多军（D.A.）的第一次集会是在哪里举行的？', optionsJson: JSON.stringify(['A. 有求必应屋', 'B. 猪头酒吧', 'C. 三把扫帚', 'D. 海格的小屋']), answer: 'B' },
      { question: '纳威·隆巴顿的父母曾是著名的？', optionsJson: JSON.stringify(['A. 圣芒戈医生', 'B. 傲罗', 'C. 魔法部高官', 'D. 霍格沃茨教授']), answer: 'B' },
      { question: '拉文克劳公共休息室的进入方式是？', optionsJson: JSON.stringify(['A. 敲击木桶', 'B. 回答鹰形门环的谜题', 'C. 对着画像说出口令', 'D. 挠一挠画像上的梨子']), answer: 'B' },
      { question: '伏地魔的母亲叫什么名字？', optionsJson: JSON.stringify(['A. 梅洛普·冈特', 'B. 贝拉特里克斯', 'C. 沃尔布加', 'D. 纳西莎']), answer: 'A' },
      { question: '迷情剂（Amortentia）的典型特征是？', optionsJson: JSON.stringify(['A. 冒出青色的烟雾', 'B. 呈珍珠母的光泽', 'C. 气味辛辣', 'D. 喝下去会变绿']), answer: 'B' },
      { question: '谁在霍格沃茨保卫战中杀死了贝拉特里克斯？', optionsJson: JSON.stringify(['A. 赫敏·格兰杰', 'B. 金妮·韦斯莱', 'C. 莫丽·韦斯莱', 'D. 卢娜·洛夫古德']), answer: 'C' },
      { question: '滑稽滑稽（Riddikulus）咒语是用来对付？', optionsJson: JSON.stringify(['A. 摄魂怪', 'B. 博格特', 'C. 康沃尔郡小精灵', 'D. 皮皮鬼']), answer: 'B' },
      { question: '金妮·韦斯莱的守护神是什么？', optionsJson: JSON.stringify(['A. 兔子', 'B. 马', 'C. 鼬鼠', 'D. 天鹅']), answer: 'B' },
    ],
  });
  console.log('📝 论文答题已创建');

  // 对角巷商店
  await prisma.shop.createMany({
    data: [
      { name: '古灵阁', description: '巫师银行', icon: '🏦', sortOrder: 1 },
      { name: '神奇动物园', description: '魔法生物与宠物', icon: '🐉', sortOrder: 2 },
      { name: '韦斯莱魔法把戏坊', description: '恶作剧与玩笑', icon: '🎉', sortOrder: 3 },
      { name: '丽痕书店', description: '魔法书籍与论文', icon: '📚', sortOrder: 4 },
      { name: '摩金夫人长袍店', description: '巫师服饰与礼服', icon: '👗', sortOrder: 5 },
      { name: '奥利凡德魔杖店', description: '魔杖选定巫师', icon: '🪄', sortOrder: 6 },
      { name: '蜂蜜公爵糖果店', description: '魔法糖果与点心', icon: '🍬', sortOrder: 7 },
      { name: '魁地奇精品店', description: '飞天扫帚与装备', icon: '🧹', sortOrder: 8 },
    ],
  });
  console.log('🏪 对角巷商店已创建');

  // 为各商店创建商品
  const shops = await prisma.shop.findMany();
  const shopMap = Object.fromEntries(shops.map(s => [s.name, s]));

  // 古灵阁 — 金加隆兑换凭证
  if (shopMap['古灵阁']) {
    await prisma.product.createMany({
      data: [
        { shopId: shopMap['古灵阁'].id, name: '100 金加隆兑换凭证', description: '古灵阁专用兑换凭证，可用于账户入账流程', priceGalleons: 0, itemType: 'galleons', itemPayloadJson: JSON.stringify({ amount: 100, exchangeRateGbp: 12.35 }), stock: null, limitPerUser: null, sortOrder: 1 },
        { shopId: shopMap['古灵阁'].id, name: '500 金加隆兑换凭证', description: '古灵阁专用兑换凭证，可用于账户入账流程', priceGalleons: 0, itemType: 'galleons', itemPayloadJson: JSON.stringify({ amount: 500, exchangeRateGbp: 12.35 }), stock: null, limitPerUser: null, sortOrder: 2 },
      ],
    });
  }

  // 神奇动物园
  if (shopMap['神奇动物园']) {
    await prisma.product.createMany({
      data: [
        { shopId: shopMap['神奇动物园'].id, name: '龙蛋（匈牙利树蜂）', description: '一枚匈牙利树蜂龙蛋，稀有宠物', priceGalleons: 100, itemType: 'pet_egg', itemPayloadJson: JSON.stringify({ species: 'dragon', dragonType: 'hungarian_horn_tail' }), stock: 10, limitPerUser: 3, sortOrder: 1 },
        { shopId: shopMap['神奇动物园'].id, name: '龙蛋（威尔士绿龙）', description: '一枚威尔士绿龙龙蛋，稀有宠物', priceGalleons: 100, itemType: 'pet_egg', itemPayloadJson: JSON.stringify({ species: 'dragon', dragonType: 'welsh_green' }), stock: 10, limitPerUser: 3, sortOrder: 2 },
        { shopId: shopMap['神奇动物园'].id, name: '龙蛋（挪威脊背龙）', description: '一枚挪威脊背龙龙蛋，海格的挚爱', priceGalleons: 120, itemType: 'pet_egg', itemPayloadJson: JSON.stringify({ species: 'dragon', dragonType: 'norwegian_ridgeback' }), stock: 5, limitPerUser: 2, sortOrder: 3 },
        { shopId: shopMap['神奇动物园'].id, name: '苹果条（5个）', description: '龙最喜欢的零食，喂食增加饱腹度', priceGalleons: 10, itemType: 'pet_food', itemPayloadJson: JSON.stringify({ foodType: 'apple_slice', quantity: 5 }), stock: 100, limitPerUser: null, sortOrder: 4 },
        { shopId: shopMap['神奇动物园'].id, name: '龙饲料包（10个）', description: '营养均衡的专用龙饲料', priceGalleons: 15, itemType: 'pet_food', itemPayloadJson: JSON.stringify({ foodType: 'dragon_feed', quantity: 10 }), stock: 80, limitPerUser: null, sortOrder: 5 },
        { shopId: shopMap['神奇动物园'].id, name: '猫头鹰（雪鸮）', description: '一只漂亮的雪鸮，可用来送信', priceGalleons: 50, itemType: 'pet', itemPayloadJson: JSON.stringify({ species: 'owl', breed: 'snowy' }), stock: 20, limitPerUser: 5, sortOrder: 6 },
        { shopId: shopMap['神奇动物园'].id, name: '宠物猫（姜黄色）', description: '一只姜黄色的猫咪，赫敏同款', priceGalleons: 30, itemType: 'pet', itemPayloadJson: JSON.stringify({ species: 'cat', color: 'ginger' }), stock: 15, limitPerUser: 3, sortOrder: 7 },
      ],
    });
  }

  // 韦斯莱魔法把戏坊
  if (shopMap['韦斯莱魔法把戏坊']) {
    await prisma.product.createMany({
      data: [
        { shopId: shopMap['韦斯莱魔法把戏坊'].id, name: '便携沼泽', description: '便携式沼泽，让费尔奇气疯一整天', priceGalleons: 20, itemType: 'consumable', itemPayloadJson: JSON.stringify({ effect: 'portable_swamp' }), stock: 50, limitPerUser: 10, sortOrder: 1 },
        { shopId: shopMap['韦斯莱魔法把戏坊'].id, name: '速效逃课糖', description: '吃一颗就能让你瞬间不舒服到医疗翼', priceGalleons: 5, itemType: 'consumable', itemPayloadJson: JSON.stringify({ effect: 'skip_class' }), stock: 200, limitPerUser: 50, sortOrder: 2 },
        { shopId: shopMap['韦斯莱魔法把戏坊'].id, name: '肥舌太妃糖', description: '吃了之后舌头会变大一倍', priceGalleons: 3, itemType: 'consumable', itemPayloadJson: JSON.stringify({ effect: 'fat_tongue' }), stock: 300, limitPerUser: null, sortOrder: 3 },
        { shopId: shopMap['韦斯莱魔法把戏坊'].id, name: '金丝雀饼干', description: '吃下后短暂变成一只金丝雀', priceGalleons: 8, itemType: 'consumable', itemPayloadJson: JSON.stringify({ effect: 'canary_transform' }), stock: 100, limitPerUser: 20, sortOrder: 4 },
        { shopId: shopMap['韦斯莱魔法把戏坊'].id, name: '白日梦咒', description: '可以在梦境群聊中开启韦斯莱白日梦剧场', priceGalleons: 50, itemType: 'special', itemPayloadJson: JSON.stringify({ effect: 'daydream_charm' }), stock: 30, limitPerUser: 5, sortOrder: 5 },
        { shopId: shopMap['韦斯莱魔法把戏坊'].id, name: '秘鲁 Instant Darkness Powder', description: '瞬间制造一片黑暗，方便脱身', priceGalleons: 15, itemType: 'consumable', itemPayloadJson: JSON.stringify({ effect: 'darkness_powder' }), stock: 60, limitPerUser: 10, sortOrder: 6 },
      ],
    });
  }

  // 丽痕书店
  if (shopMap['丽痕书店']) {
    await prisma.product.createMany({
      data: [
        { shopId: shopMap['丽痕书店'].id, name: '魔法史：标准咒语（初级）', description: '一年级标准魔咒学教材', priceGalleons: 20, itemType: 'book', itemPayloadJson: JSON.stringify({ type: 'textbook', subject: 'spells' }), stock: 100, limitPerUser: null, sortOrder: 1 },
        { shopId: shopMap['丽痕书店'].id, name: '千种神奇药草与蕈类', description: '草药学必备参考书', priceGalleons: 25, itemType: 'book', itemPayloadJson: JSON.stringify({ type: 'textbook', subject: 'herbology' }), stock: 80, limitPerUser: null, sortOrder: 2 },
        { shopId: shopMap['丽痕书店'].id, name: '妖怪们的妖怪书', description: '神奇动物保护课教材，会咬人', priceGalleons: 30, itemType: 'book', itemPayloadJson: JSON.stringify({ type: 'textbook', subject: 'magical_creatures' }), stock: 40, limitPerUser: 5, sortOrder: 3 },
        { shopId: shopMap['丽痕书店'].id, name: '初级变形术指导', description: '麦格教授推荐的变形术入门', priceGalleons: 22, itemType: 'book', itemPayloadJson: JSON.stringify({ type: 'textbook', subject: 'transfiguration' }), stock: 90, limitPerUser: null, sortOrder: 4 },
        { shopId: shopMap['丽痕书店'].id, name: '二十世纪伟大巫师', description: '了解当代最杰出的巫师们', priceGalleons: 15, itemType: 'book', itemPayloadJson: JSON.stringify({ type: 'general' }), stock: 50, limitPerUser: null, sortOrder: 5 },
        { shopId: shopMap['丽痕书店'].id, name: '唱唱反调（订阅版）', description: '卢娜爸爸主编的杂志，有趣且古怪', priceGalleons: 5, itemType: 'consumable', itemPayloadJson: JSON.stringify({ type: 'magazine' }), stock: 200, limitPerUser: null, sortOrder: 6 },
      ],
    });
  }

  // 摩金夫人长袍店
  if (shopMap['摩金夫人长袍店']) {
    await prisma.product.createMany({
      data: [
        { shopId: shopMap['摩金夫人长袍店'].id, name: '日常巫师长袍', description: '合身的日常款巫师长袍', priceGalleons: 30, itemType: 'clothing', itemPayloadJson: JSON.stringify({ type: 'robe', style: 'daily' }), stock: null, limitPerUser: null, sortOrder: 1 },
        { shopId: shopMap['摩金夫人长袍店'].id, name: '礼服长袍', description: '圣诞舞会等正式场合的礼袍', priceGalleons: 52, itemType: 'clothing', itemPayloadJson: JSON.stringify({ type: 'robe', style: 'formal', charm: 20 }), stock: 30, limitPerUser: 5, sortOrder: 2 },
        { shopId: shopMap['摩金夫人长袍店'].id, name: '精致舞会礼服', description: '精美绝伦的舞会礼服，魅力+200', priceGalleons: 520, itemType: 'clothing', itemPayloadJson: JSON.stringify({ type: 'ball_dress', style: 'fancy', charm: 200 }), stock: 10, limitPerUser: 2, sortOrder: 3 },
        { shopId: shopMap['摩金夫人长袍店'].id, name: '奢华夏日舞裙', description: '顶级丝绸舞裙，魅力+400', priceGalleons: 1314, itemType: 'clothing', itemPayloadJson: JSON.stringify({ type: 'ball_dress', style: 'luxury', charm: 400 }), stock: 5, limitPerUser: 1, sortOrder: 4 },
        { shopId: shopMap['摩金夫人长袍店'].id, name: '泳装', description: '夏天游泳必备', priceGalleons: 100, itemType: 'clothing', itemPayloadJson: JSON.stringify({ type: 'swimsuit' }), stock: 50, limitPerUser: 5, sortOrder: 5 },
        { shopId: shopMap['摩金夫人长袍店'].id, name: '学院围巾', description: '印有学院徽章的保暖围巾', priceGalleons: 15, itemType: 'clothing', itemPayloadJson: JSON.stringify({ type: 'scarf' }), stock: null, limitPerUser: null, sortOrder: 6 },
      ],
    });
  }

  // 奥利凡德魔杖店
  if (shopMap['奥利凡德魔杖店']) {
    await prisma.product.createMany({
      data: [
        { shopId: shopMap['奥利凡德魔杖店'].id, name: '冬青木凤凰羽魔杖', description: '十一英寸，冬青木，凤凰羽毛杖芯。哈利·波特同款', priceGalleons: 45, itemType: 'wand', itemPayloadJson: JSON.stringify({ wood: 'holly', core: 'phoenix_feather', length: 11 }), stock: 5, limitPerUser: 1, sortOrder: 1 },
        { shopId: shopMap['奥利凡德魔杖店'].id, name: '葡萄藤木龙心弦魔杖', description: '十又四分之三英寸，葡萄藤木，龙心弦杖芯', priceGalleons: 40, itemType: 'wand', itemPayloadJson: JSON.stringify({ wood: 'vine', core: 'dragon_heartstring', length: 10.75 }), stock: 10, limitPerUser: 1, sortOrder: 2 },
        { shopId: shopMap['奥利凡德魔杖店'].id, name: '黑胡桃木独角兽毛魔杖', description: '十一英寸，黑胡桃木，独角兽毛杖芯', priceGalleons: 42, itemType: 'wand', itemPayloadJson: JSON.stringify({ wood: 'black_walnut', core: 'unicorn_hair', length: 11 }), stock: 8, limitPerUser: 1, sortOrder: 3 },
        { shopId: shopMap['奥利凡德魔杖店'].id, name: '樱桃木夜骐尾羽魔杖', description: '九又二分之一英寸，樱桃木，夜骐尾羽杖芯', priceGalleons: 48, itemType: 'wand', itemPayloadJson: JSON.stringify({ wood: 'cherry', core: 'thestral_tail', length: 9.5 }), stock: 3, limitPerUser: 1, sortOrder: 4 },
      ],
    });
  }

  // 蜂蜜公爵糖果店
  if (shopMap['蜂蜜公爵糖果店']) {
    await prisma.product.createMany({
      data: [
        { shopId: shopMap['蜂蜜公爵糖果店'].id, name: '比比多味豆（盒装）', description: '每一颗味道都不同，可能遇到耳屎味', priceGalleons: 3, itemType: 'consumable', itemPayloadJson: JSON.stringify({ type: 'candy', candyType: 'every_flavour_beans' }), stock: null, limitPerUser: null, sortOrder: 1 },
        { shopId: shopMap['蜂蜜公爵糖果店'].id, name: '巧克力蛙（盒装）', description: '附赠著名巫师卡片', priceGalleons: 5, itemType: 'consumable', itemPayloadJson: JSON.stringify({ type: 'candy', candyType: 'chocolate_frog' }), stock: null, limitPerUser: null, sortOrder: 2 },
        { shopId: shopMap['蜂蜜公爵糖果店'].id, name: '南瓜汁（瓶装）', description: '霍格沃茨最受欢迎的饮品', priceGalleons: 2, itemType: 'consumable', itemPayloadJson: JSON.stringify({ type: 'drink', drinkType: 'pumpkin_juice' }), stock: null, limitPerUser: null, sortOrder: 3 },
        { shopId: shopMap['蜂蜜公爵糖果店'].id, name: '黄油啤酒（瓶装）', description: '三把扫帚的招牌饮品，不含酒精', priceGalleons: 4, itemType: 'consumable', itemPayloadJson: JSON.stringify({ type: 'drink', drinkType: 'butterbeer' }), stock: null, limitPerUser: null, sortOrder: 4 },
        { shopId: shopMap['蜂蜜公爵糖果店'].id, name: '甘草魔杖（袋装）', description: '嚼着玩的甘草味糖果魔杖', priceGalleons: 2, itemType: 'consumable', itemPayloadJson: JSON.stringify({ type: 'candy', candyType: 'licorice_wand' }), stock: null, limitPerUser: null, sortOrder: 5 },
        { shopId: shopMap['蜂蜜公爵糖果店'].id, name: '酸味爆爆糖', description: '酸到让你怀疑人生，然后变甜', priceGalleons: 3, itemType: 'consumable', itemPayloadJson: JSON.stringify({ type: 'candy', candyType: 'acid_pops' }), stock: null, limitPerUser: null, sortOrder: 6 },
        { shopId: shopMap['蜂蜜公爵糖果店'].id, name: '血味棒棒糖', description: '吸血鬼的最爱', priceGalleons: 4, itemType: 'consumable', itemPayloadJson: JSON.stringify({ type: 'candy', candyType: 'blood_pop' }), stock: null, limitPerUser: null, sortOrder: 7 },
      ],
    });
  }

  // 魁地奇精品店
  if (shopMap['魁地奇精品店']) {
    await prisma.product.createMany({
      data: [
        { shopId: shopMap['魁地奇精品店'].id, name: '光轮2000', description: '经典款比赛扫帚，魁地奇判定+10%', priceGalleons: 200, itemType: 'broom', itemPayloadJson: JSON.stringify({ model: 'nimbus_2000', speed: 10 }), stock: 20, limitPerUser: 2, sortOrder: 1 },
        { shopId: shopMap['魁地奇精品店'].id, name: '光轮2001', description: '最新款扫帚，魁地奇判定额外+10%，与火弩箭可叠加', priceGalleons: 350, itemType: 'broom', itemPayloadJson: JSON.stringify({ model: 'nimbus_2001', speed: 20 }), stock: 10, limitPerUser: 1, sortOrder: 2 },
        { shopId: shopMap['魁地奇精品店'].id, name: '火弩箭', description: '世界顶级比赛扫帚，魁地奇判定额外+20%', priceGalleons: 500, itemType: 'broom', itemPayloadJson: JSON.stringify({ model: 'firebolt', speed: 30 }), stock: 5, limitPerUser: 1, sortOrder: 3 },
        { shopId: shopMap['魁地奇精品店'].id, name: '魁地奇守门员手套', description: '专业守门员手套，增加扑救成功率', priceGalleons: 30, itemType: 'equipment', itemPayloadJson: JSON.stringify({ type: 'quidditch_gloves' }), stock: 50, limitPerUser: 5, sortOrder: 4 },
        { shopId: shopMap['魁地奇精品店'].id, name: '魁地奇护具套装', description: '包含护肩、护膝、护肘', priceGalleons: 45, itemType: 'equipment', itemPayloadJson: JSON.stringify({ type: 'quidditch_pads' }), stock: 30, limitPerUser: 5, sortOrder: 5 },
        { shopId: shopMap['魁地奇精品店'].id, name: '金色飞贼（收藏版）', description: '纯金打造的收藏版飞贼，不能用来比赛', priceGalleons: 150, itemType: 'collectible', itemPayloadJson: JSON.stringify({ type: 'golden_snitch' }), stock: 10, limitPerUser: 2, sortOrder: 6 },
        { shopId: shopMap['魁地奇精品店'].id, name: '魁地奇队服（格兰芬多）', description: '格兰芬多红色魁地奇队服', priceGalleons: 25, itemType: 'clothing', itemPayloadJson: JSON.stringify({ type: 'quidditch_robe', house: '格兰芬多' }), stock: null, limitPerUser: null, sortOrder: 7 },
        { shopId: shopMap['魁地奇精品店'].id, name: '魁地奇队服（斯莱特林）', description: '斯莱特林绿色魁地奇队服', priceGalleons: 25, itemType: 'clothing', itemPayloadJson: JSON.stringify({ type: 'quidditch_robe', house: '斯莱特林' }), stock: null, limitPerUser: null, sortOrder: 8 },
      ],
    });
  }

  console.log('🎁 对角巷商品已创建');
  console.log('✅ 魔法数据播种完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
