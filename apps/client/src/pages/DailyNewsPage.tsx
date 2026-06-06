import { motion } from 'framer-motion';
import { Clock, Mail, Newspaper, Sparkles, Wand2 } from 'lucide-react';

const leadStories = [
  {
    section: '头版',
    title: '猫头鹰清晨撞入礼堂，银色蜡封信件自行展开',
    body: '目击学生称，信纸在长桌上方盘旋三圈后落向格兰芬多席位。麦格教授已将信件带走检查，校方暂未确认其是否与新生名册异常有关。',
  },
  {
    section: '对角巷',
    title: '蜂蜜公爵推出会跳舞的糖羽毛笔',
    body: '这款糖羽毛笔会在墨水瓶旁轻轻旋转，写完作业后还能变成薄荷味糖棒。店员表示周末可能需要排队，限量包装已被抢购一空。',
  },
  {
    section: '金库',
    title: '古灵阁今日汇率稳定，妖精柜台提醒核对兑换凭证',
    body: '巫师银行继续采用 1 金加隆 = 17 银西可 = 493 铜纳特的标准换算。柜台建议以页面底部汇率为准，并妥善保存兑换单号。',
  },
];

const briefs = [
  '魁地奇训练场晚间开放时间延长至二十一点。',
  '猫头鹰邮局新增防雨信封，雨天飞行损耗明显下降。',
  '魔药课教室发现自动冒泡坩埚，管理员已登记认领。',
  '图书馆禁书区门环今日心情良好，但仍需通行许可。',
];

const sideColumns = [
  {
    title: '社会版',
    body: '南塔楼画像今日集体更换丝带。几位画像坚持声称这是为了迎接一个更有新闻感的早晨，并要求记者拍摄它们“最权威的一面”。',
  },
  {
    title: '体育版',
    body: '霍琦夫人确认，本周末魁地奇练习赛将启用新的安全结界。追球手需提前登记扫帚型号，火弩箭使用者将被安排单独测速。',
  },
  {
    title: '读者来信',
    body: '一名一年级学生询问会动照片是否会偷吃巧克力蛙。编辑部郑重回复：照片不会吃，但照片里的人可能会装作很饿。',
  },
];

const editions = [
  '预言家日报 · 清晨版',
  '预言家晚报 · 突发更新',
  '星期日预言家报 · 特刊',
  '唱唱反调 · 怪谈专栏',
];

export default function DailyNewsPage() {
  return (
    <div className="relative mx-auto max-w-7xl overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(197,160,89,0.18),transparent_34%),linear-gradient(180deg,rgba(13,8,4,0.88),rgba(13,8,4,0.35))]" />

      <article className="magic-newspaper newspaper-fold relative overflow-hidden border border-[#5f4525]/80 bg-[#ead9b8] px-4 py-5 text-[#21180e] shadow-[0_18px_48px_rgba(0,0,0,0.32)] sm:px-7 lg:px-10">
        <div className="absolute inset-0 magic-newspaper-grain" aria-hidden="true" />
        <div className="absolute inset-0 newspaper-creases" aria-hidden="true" />

        <header className="relative border-b-[5px] border-double border-[#21180e] pb-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.32em] text-[#5a4024]">
                <Newspaper className="h-4 w-4" aria-hidden="true" />
                Wizarding Press
              </div>
              <motion.h1
                className="mt-2 font-serif text-5xl font-black leading-none text-[#171008] sm:text-7xl lg:text-8xl"
                animate={{ x: [0, -1, 1, 0], opacity: [1, 0.94, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                预言家日报
              </motion.h1>
            </div>

            <div className="min-w-[180px] border-l-4 border-[#21180e] pl-4 text-right font-serif text-sm text-[#4b351d]">
              <p className="font-bold text-[#171008]">霍格沃茨校内特供</p>
              <p>第九又四分之三期</p>
              <p>售价 2 纳特 · 猫头鹰投递</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 border-y border-[#21180e] py-2 text-center font-serif text-xs font-bold uppercase tracking-[0.24em] text-[#2d2115] sm:grid-cols-4">
            {editions.map((edition) => (
              <span key={edition}>{edition}</span>
            ))}
          </div>
        </header>

        <section className="relative grid gap-6 border-b-[3px] border-[#21180e] py-5 lg:grid-cols-[1.18fr_0.82fr]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 border-y-2 border-[#21180e] py-1 text-xs font-black uppercase tracking-[0.28em]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Moving Picture Edition
            </p>
            <motion.h2
              className="magic-headline font-serif text-4xl font-black leading-[0.95] text-[#171008] sm:text-6xl lg:text-7xl"
              animate={{ textShadow: ['0 0 0 rgba(0,0,0,0)', '2px 1px 0 rgba(73,45,17,0.22)', '0 0 0 rgba(0,0,0,0)'] }}
              transition={{ duration: 3.4, repeat: Infinity }}
            >
              会动的晨报在礼堂上空自行折页
            </motion.h2>
            <p className="mt-4 max-w-3xl columns-1 gap-6 font-serif text-base leading-7 text-[#3c2b18] sm:columns-2">
              清晨第一缕光穿过大礼堂高窗时，几张泛黄羊皮纸突然自行折叠成飞鸟形状，在长桌上方绕行三圈后落回各学院席位。教授们确认这不是恶作剧，而是一种稳定的新闻传递魔法。校方表示，每日新闻页面将用于展示校内快讯、对角巷行情、金库提醒和猫头鹰投递公告。
            </p>
          </div>

          <motion.figure
            className="magic-photo newspaper-photo relative min-h-[330px] overflow-hidden border-[7px] border-[#171008] bg-stone-900 p-3 shadow-xl"
            animate={{ rotate: [-0.45, 0.35, -0.45] }}
            transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="relative h-full min-h-[300px] overflow-hidden bg-[#1a1714]">
              <div className="absolute inset-0 moving-photo-halftone" aria-hidden="true" />
              <motion.div
                className="absolute left-1/2 top-16 h-32 w-32 -translate-x-1/2 rounded-full bg-[#f1dfaa]/80 blur-2xl"
                animate={{ scale: [1, 1.24, 1], x: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-36 bg-[linear-gradient(135deg,transparent_0_38%,rgba(234,217,184,0.86)_38%_42%,transparent_42%_100%)]"
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute left-10 top-20 h-16 w-24 border-2 border-[#ead9b8] bg-[#ead9b8]/10"
                animate={{ x: [0, 18, -6, 0], rotate: [-4, 3, -2, -4] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute right-12 top-10 h-24 w-1 bg-[#f7e9bb]/75 shadow-[0_0_30px_rgba(252,211,77,0.9)]"
                animate={{ opacity: [0.45, 1, 0.45], rotate: [8, 14, 8] }}
                transition={{ duration: 2.2, repeat: Infinity }}
              />
              <div className="absolute bottom-0 left-6 h-24 w-16 bg-black/70 shadow-[28px_-18px_0_rgba(0,0,0,0.58),64px_-3px_0_rgba(0,0,0,0.52),118px_-28px_0_rgba(0,0,0,0.6)]" />
              <figcaption className="absolute bottom-3 left-3 right-3 border-t border-[#ead9b8]/45 pt-2 font-serif text-xs italic text-[#ead9b8]">
                动态照片：城堡剪影、移动信纸与魔法咒光，黑白普通版。
              </figcaption>
            </div>
          </motion.figure>
        </section>

        <section className="grid gap-5 border-b-2 border-[#21180e] py-5 lg:grid-cols-3">
          {leadStories.map((story, index) => (
            <motion.article
              key={story.title}
              className="border-b border-[#21180e] pb-4 lg:border-b-0 lg:border-r lg:pr-5 last:lg:border-r-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <span className="text-[11px] font-black tracking-[0.3em] text-red-950">{story.section}</span>
              <h3 className="mt-2 font-serif text-2xl font-black leading-tight text-[#171008]">{story.title}</h3>
              <p className="mt-3 font-serif text-sm leading-6 text-[#3c2b18]">{story.body}</p>
            </motion.article>
          ))}
        </section>

        <section className="grid gap-5 border-b-2 border-[#21180e] py-5 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="bg-[#171008] px-4 py-4 text-[#ead9b8]">
            <div className="mb-3 flex items-center gap-2 text-sm font-black tracking-[0.25em]">
              <Clock className="h-4 w-4" aria-hidden="true" />
              快讯
            </div>
            <div className="space-y-3">
              {briefs.map((brief) => (
                <p key={brief} className="border-t border-[#ead9b8]/25 pt-3 font-serif text-sm leading-5">
                  {brief}
                </p>
              ))}
            </div>
          </aside>

          <div className="grid gap-4 sm:grid-cols-3">
            {sideColumns.map((column) => (
              <article key={column.title}>
                <h3 className="border-b border-[#21180e] pb-1 font-serif text-lg font-black text-[#171008]">{column.title}</h3>
                <p className="mt-2 font-serif text-sm leading-6 text-[#3c2b18] first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-black first-letter:leading-none">
                  {column.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-5">
          <div className="border-y-2 border-[#21180e] px-2 py-4 font-serif text-[#2d2115] sm:px-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em]">
              <Mail className="h-4 w-4" aria-hidden="true" />
              编辑部启事
            </div>
            <p className="text-sm leading-7">
              如需联系作者、投稿、爆料、补充校内见闻，或申请刊登对角巷商铺广告，请将猫头鹰信件投递至「预言家日报驻霍格沃茨临时编辑部」。来信请注明姓名、学院、可公开署名方式与事件发生地点。紧急爆料可在信封外侧写下「加急」，本报会优先交由值班羽毛笔誊录。
            </p>
            <p className="mt-2 text-xs italic leading-6 text-[#5a4024]">
              编辑部保留删改来稿标题、校对错字与隐藏爆料人身份的权利。恶作剧投稿可能被退回，并附赠一张会皱眉的空白便签。
            </p>
          </div>
        </section>

        <div className="relative overflow-hidden border-y-2 border-[#21180e] py-2">
          <motion.div
            className="flex w-max gap-10 whitespace-nowrap font-serif text-sm font-bold text-[#171008]"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          >
            {[...briefs, ...briefs].map((brief, index) => (
              <span key={`${brief}-${index}`} className="inline-flex items-center gap-2">
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                {brief}
              </span>
            ))}
          </motion.div>
        </div>
      </article>
    </div>
  );
}
