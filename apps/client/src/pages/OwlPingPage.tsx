import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive,
  BatteryMedium,
  BookOpen,
  CalendarDays,
  ChevronUp,
  CircleUserRound,
  Coins,
  Gamepad2,
  MessageCircle,
  Newspaper,
  NotebookPen,
  Palette,
  Radio,
  Settings,
  ShoppingBag,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react';

type OwlApp = {
  id: string;
  name: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  route?: string;
};

const pages: OwlApp[][] = [
  [
    { id: 'chat', name: 'owl chat', subtitle: '进入主线跑团', icon: MessageCircle, color: 'rgb(244, 58, 145)', route: '/app/story-chat' },
    { id: 'feed', name: 'Owl Feed', subtitle: '每日新闻', icon: Newspaper, color: 'rgb(240, 91, 156)', route: '/app/news' },
    { id: 'circle', name: 'Owl Circle', subtitle: '魔法圈', icon: Radio, color: 'rgb(240, 91, 156)', route: '/app/circle' },
    { id: 'diary', name: '日记本', subtitle: '学生日志', icon: NotebookPen, color: 'rgb(217, 138, 95)' },
    { id: 'event', name: '事件卡', subtitle: '任务触发器', icon: CalendarDays, color: 'rgb(239, 117, 170)' },
    { id: 'space', name: 'Owl Space', subtitle: '有求必应屋', icon: Sparkles, color: 'rgb(183, 138, 223)', route: '/app/room' },
    { id: 'wallet', name: '嗅嗅钱包', subtitle: '巫师银行', icon: Coins, color: 'rgb(121, 171, 199)', route: '/app/vault' },
    { id: 'shop', name: 'Owl Shop', subtitle: '对角巷商城', icon: ShoppingBag, color: 'rgb(242, 107, 159)', route: '/app/diagon-alley' },
  ],
  [
    { id: 'settings', name: '设置', subtitle: '魔法偏好', icon: Settings, color: 'rgb(168, 160, 216)', route: '/app/settings' },
    { id: 'play', name: '玩机中心', subtitle: '功能实验室', icon: Gamepad2, color: 'rgb(106, 167, 216)' },
    { id: 'profile', name: '猫头鹰档案', subtitle: '入学登记表', icon: CircleUserRound, color: 'rgb(225, 102, 153)', route: '/app/profile' },
    { id: 'world', name: '世界书', subtitle: '世界观资料', icon: BookOpen, color: 'rgb(125, 152, 200)' },
    { id: 'style', name: '装扮工坊', subtitle: '主题与外观', icon: Palette, color: 'rgb(200, 137, 223)' },
    { id: 'dev', name: '开发者模式', subtitle: '调试入口', icon: Archive, color: 'rgb(100, 116, 139)' },
  ],
];

const dockIds = ['chat', 'wallet', 'settings', 'profile'];

export default function OwlPingPage() {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(false);
  const [page, setPage] = useState(0);
  const [activeApp, setActiveApp] = useState<OwlApp | null>(null);

  const now = useMemo(() => new Date(), []);
  const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  const allApps = [...pages[0], ...pages[1]];
  const dockApps = dockIds.map((id) => allApps.find((app) => app.id === id)).filter(Boolean) as OwlApp[];

  const openApp = (app: OwlApp) => {
    if (app.route) {
      navigate(app.route);
      return;
    }
    setActiveApp(app);
  };

  return (
    <main className="min-h-[calc(100dvh-7rem)] overflow-hidden rounded-lg border border-white/35 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.92),transparent_28%),linear-gradient(135deg,#ffe4ef_0%,#fff7fb_42%,#e7e2ff_100%)] px-2 py-4 text-[#3c3d44] shadow-[0_24px_80px_rgba(35,18,35,0.22)] sm:px-8 sm:py-6">
      <section className="mx-auto flex h-[min(760px,calc(100dvh-8rem))] min-h-[620px] w-full max-w-[430px] flex-col overflow-hidden rounded-[30px] border-[7px] border-[#25202a] bg-[#fff6fb] shadow-[0_32px_90px_rgba(36,20,37,0.36)] sm:rounded-[42px] sm:border-[10px]">
        <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-[22px] sm:rounded-[30px]">
          <AnimatePresence mode="wait">
            {!unlocked ? (
              <motion.button
                key="lock"
                type="button"
                onClick={() => setUnlocked(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ y: -80, opacity: 0 }}
                className="relative flex w-full flex-col items-center justify-between overflow-hidden bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.45),transparent_26%),linear-gradient(160deg,#fe8cbd_0%,#ef6faa_54%,#c79ce9_100%)] px-8 py-10 text-white"
              >
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,rgba(255,255,255,0.22),transparent_20%),radial-gradient(circle_at_78%_34%,rgba(255,255,255,0.18),transparent_18%)]" />
                <span className="relative inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/18 px-4 py-2 text-sm font-bold shadow-lg backdrop-blur">
                  <img src="https://owlping.yuyanjia.top/brand/owl-ping-icon-64.png" alt="" className="h-6 w-6 rounded-full" />
                  Owl Ping
                </span>

                <span className="relative text-center">
                  <span className="block font-sans text-7xl font-light leading-none tracking-normal">{time}</span>
                  <span className="mt-3 block text-lg font-medium text-white/86">猫头鹰呼叫</span>
                </span>

                <span className="relative mb-4 flex flex-col items-center gap-2 text-sm font-medium text-white/88">
                  <ChevronUp className="h-7 w-7 animate-bounce" />
                  向上滑动解锁
                </span>
              </motion.button>
            ) : (
              <motion.div
                key="desktop"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.9),transparent_24%),linear-gradient(160deg,#fff7fb_0%,#ffe4ef_42%,#dfe8ff_100%)]"
              >
                <header className="flex h-14 shrink-0 items-center justify-between bg-white/88 px-5 text-sm font-bold shadow-sm backdrop-blur">
                  <span>Owl Ping</span>
                  <span className="flex items-center gap-2 text-[#55565e]">
                    <Wifi className="h-4 w-4" />
                    <BatteryMedium className="h-5 w-5" />
                    {time}
                  </span>
                </header>

                <div className="px-6 pt-6">
                  <p className="font-sans text-5xl font-light leading-none tracking-normal text-[#3b3840]">{time}</p>
                  <p className="mt-2 text-sm font-medium text-[#6a6570]">{date}</p>
                </div>

                <div className="grid flex-1 grid-cols-4 content-start gap-x-2 gap-y-4 px-4 py-5 sm:gap-x-3 sm:gap-y-5 sm:px-5 sm:py-7">
                  {pages[page].map((app) => (
                    <AppIcon key={app.id} app={app} onClick={() => openApp(app)} />
                  ))}
                </div>

                <div className="mb-4 flex justify-center gap-2">
                  {pages.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-label={`切换到第 ${index + 1} 页`}
                      onClick={() => setPage(index)}
                      className={`h-2 rounded-full transition-all ${page === index ? 'w-6 bg-[#3c3d44]/55' : 'w-2 bg-[#3c3d44]/25'}`}
                    />
                  ))}
                </div>

                <nav className="mx-4 mb-4 grid h-[74px] grid-cols-4 items-center rounded-[24px] border border-pink-200/70 bg-white/76 px-2 shadow-[0_14px_40px_rgba(139,73,105,0.16)] backdrop-blur sm:mx-5 sm:mb-5 sm:h-[82px] sm:rounded-[28px] sm:px-3">
                  {dockApps.map((app) => (
                    <button key={app.id} type="button" onClick={() => openApp(app)} className="flex justify-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-[16px] text-white shadow-md sm:h-[54px] sm:w-[54px] sm:rounded-[18px]" style={{ background: app.color }}>
                        <app.icon className="h-6 w-6" />
                      </span>
                    </button>
                  ))}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <AnimatePresence>
        {activeApp && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 16 }}
              className="w-full max-w-md rounded-lg border border-white/50 bg-[#fff8fb] p-5 text-[#3c3d44] shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[18px] text-white shadow-md" style={{ background: activeApp.color }}>
                    <activeApp.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="font-magical text-2xl text-[#3c3d44]">{activeApp.name}</h2>
                    <p className="text-sm text-[#6a6570]">{activeApp.subtitle}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setActiveApp(null)} className="rounded-md p-2 text-[#6a6570] hover:bg-black/5">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-5 rounded-md border border-pink-200 bg-white px-4 py-5 text-sm leading-7 text-[#4b4650]">
                这个应用已放入 Owl Ping 桌面，第一版先作为本地启动器入口保留。后续可以继续接入真实数据、通知和剧情触发。
              </p>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function AppIcon({ app, onClick }: { app: OwlApp; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-w-0 flex-col items-center gap-2 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-[16px] text-white shadow-[0_10px_24px_rgba(60,61,68,0.16)] transition-transform hover:-translate-y-0.5 sm:h-[58px] sm:w-[58px] sm:rounded-[20px]" style={{ background: app.color }}>
        <app.icon className="h-6 w-6 sm:h-7 sm:w-7" />
      </span>
      <span className="w-full truncate text-[12px] font-bold leading-tight text-[#3c3d44]">{app.name}</span>
    </button>
  );
}
