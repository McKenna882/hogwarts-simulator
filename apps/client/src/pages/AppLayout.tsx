import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BookOpen,
  CircleUserRound,
  Coins,
  Dices,
  DoorOpen,
  LogOut,
  MessageCircle,
  Newspaper,
  Search,
  Settings,
  ShoppingBag,
  Smartphone,
  Star,
  Trophy,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { usersApi } from '../api/endpoints';
import OnboardingGuide from '../components/OnboardingGuide';
import HogwartsAcademyBackground from '../components/HogwartsAcademyBackground';
import { useChatStore } from '../stores/chatStore';
import { useUIStore } from '../stores/uiStore';
import { useSocket } from '../hooks/useSocket';

const ANNOUNCEMENT_VERSION = '2026-06-02';
const MANUAL_VERSION = '2026-06-02';
const APP_VERSION = '9.0.0.0';
const APP_VERSION_HASH = 'x3cmaf6d';
const APP_BACKGROUND_MUSIC_SRC = '/audio/launch-theme.mp3';

type InfoPanel = 'announcements' | 'manual' | null;

const bottomNavItems = [
  { to: '/app/owl', label: '猫头鹰', icon: MessageCircle },
  { to: '/app/owl-ping', label: '通讯器', icon: Smartphone },
  { to: '/app/story-chat', label: '主线', icon: Dices },
  { to: '/app/news', label: '新闻', icon: Newspaper },
  { to: '/app/circle', label: '魔法圈', icon: Users },
  { to: '/app/house-cup', label: '学院杯', icon: Trophy },
  { to: '/app/room', label: '有求必应屋', icon: DoorOpen },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const showToast = useUIStore((s) => s.showToast);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showVersionCheck, setShowVersionCheck] = useState(() =>
    !localStorage.getItem('hp_version_confirmed'),
  );
  const [activePanel, setActivePanel] = useState<InfoPanel>(null);
  const [search, setSearch] = useState('');
  const [noticePage, setNoticePage] = useState(0);
  const [seenAnnouncementVersion, setSeenAnnouncementVersion] = useState(() =>
    localStorage.getItem('hp_seen_announcement_version'),
  );
  const [seenManualVersion, setSeenManualVersion] = useState(() =>
    localStorage.getItem('hp_seen_manual_version'),
  );
  const [musicEnabled, setMusicEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    usersApi.getProfile().then((res) => setProfile(res.data)).catch(() => {});
  }, [setProfile]);

  useEffect(() => {
    if (showVersionCheck) return;
    if (localStorage.getItem('hp_onboarding_completed')) return;
    if (location.pathname !== '/app/owl') return;

    const timer = window.setTimeout(() => setShowOnboarding(true), 500);
    return () => window.clearTimeout(timer);
  }, [location.pathname, showVersionCheck]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = 0.32;
    if (musicEnabled) {
      audio.play().catch(() => {
        setMusicEnabled(false);
      });
    }

    return () => {
      if (fadeTimerRef.current) {
        window.clearInterval(fadeTimerRef.current);
      }
      audio.pause();
    };
  }, []);

  const displayName = profile?.displayName || user?.email?.split('@')[0] || '新生巫师';
  const house = profile?.profile?.house;
  const grade = profile?.profile?.grade;
  const wizardTitle = profile?.profile?.wizardTitle;
  const balance = profile?.wallet?.balanceGalleons ?? 0;
  const hasNewAnnouncement = false;
  const hasNewManual = false;
  const characters = useChatStore((s) => s.characters);
  const charactersLoading = useChatStore((s) => s.charactersLoading);
  const loadCharacters = useChatStore((s) => s.loadCharacters);
  const loadAffinities = useChatStore((s) => s.loadAffinities);
  const selectedCharacter = useChatStore((s) => s.selectedCharacter);
  const selectCharacter = useChatStore((s) => s.selectCharacter);
  const starredCharacters = useChatStore((s) => s.starredCharacters);
  const toggleStar = useChatStore((s) => s.toggleStar);
  const { connect } = useSocket({
    onMessageNew: () => {},
    onMessageStream: (data: any) => { useChatStore.getState().handleStreamChunk(data); },
    onMessageDone: (data: any) => { useChatStore.getState().handleStreamDone(data); },
    onMessageError: (data: any) => {
      const message = data.message || '消息发送失败';
      useChatStore.getState().handleStreamError(message);
      showToast(message, 'error');
    },
  });

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (characters.length === 0) {
      loadCharacters();
      loadAffinities();
    }
  }, [characters.length, loadCharacters, loadAffinities]);

  const sortedCharacters = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = characters.filter((character) => {
      if (!keyword) return true;
      return (
        character.name.toLowerCase().includes(keyword) ||
        character.house?.toLowerCase().includes(keyword) ||
        character.title?.toLowerCase().includes(keyword) ||
        character.grade?.toLowerCase().includes(keyword)
      );
    });

    return [...filtered].sort((a, b) => {
      const aStar = starredCharacters[a.id] ? 1 : 0;
      const bStar = starredCharacters[b.id] ? 1 : 0;
      return bStar - aStar;
    });
  }, [characters, search, starredCharacters]);

  const openPanel = (panel: Exclude<InfoPanel, null>) => {
    setActivePanel(panel);
    if (panel === 'announcements') {
      localStorage.setItem('hp_seen_announcement_version', ANNOUNCEMENT_VERSION);
      setSeenAnnouncementVersion(ANNOUNCEMENT_VERSION);
    }
    if (panel === 'manual') {
      localStorage.setItem('hp_seen_manual_version', MANUAL_VERSION);
      setSeenManualVersion(MANUAL_VERSION);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fadeAudioTo = (targetVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeTimerRef.current) {
      window.clearInterval(fadeTimerRef.current);
    }
    fadeTimerRef.current = window.setInterval(() => {
      const nextVolume = audio.volume + (targetVolume > audio.volume ? 0.04 : -0.04);
      audio.volume = Math.max(0, Math.min(targetVolume, nextVolume));
      if (Math.abs(audio.volume - targetVolume) < 0.05) {
        audio.volume = targetVolume;
        if (fadeTimerRef.current) {
          window.clearInterval(fadeTimerRef.current);
          fadeTimerRef.current = null;
        }
      }
    }, 80);
  };

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicEnabled) {
      fadeAudioTo(0);
      window.setTimeout(() => audio.pause(), 420);
      setMusicEnabled(false);
      return;
    }
    audio.volume = 0;
    audio.loop = true;
    try {
      await audio.play();
      setMusicEnabled(true);
      fadeAudioTo(0.32);
    } catch (error) {
      console.warn('主界面背景音乐需要用户点击后播放', error);
    }
  };

  const handleSelectCharacter = async (character: (typeof characters)[number]) => {
    navigate('/app/owl');
    await selectCharacter(character);
  };

  return (
    <div className="relative flex min-h-dvh bg-hogwarts-bg">
      <audio ref={audioRef} src={APP_BACKGROUND_MUSIC_SRC} preload="auto" />
      <button
        type="button"
        onClick={toggleMusic}
        className="fixed right-4 top-4 z-[80] inline-flex h-10 w-10 items-center justify-center rounded-md border border-hogwarts-gold/35 bg-black/55 text-hogwarts-gold shadow-[0_0_22px_rgba(197,160,89,0.16)] backdrop-blur transition hover:bg-hogwarts-gold hover:text-black focus:outline-none focus:ring-2 focus:ring-hogwarts-gold/50"
        aria-label={musicEnabled ? '关闭背景音乐' : '播放背景音乐'}
        title={musicEnabled ? '关闭背景音乐' : '播放背景音乐'}
      >
        {musicEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>
      <HogwartsAcademyBackground />
      <aside className="relative z-10 hidden w-80 shrink-0 flex-col border-r border-hogwarts-gold/20 bg-hogwarts-bg/92 backdrop-blur-sm xl:flex 2xl:w-96">
        <div className="border-b border-hogwarts-goldDark/30 bg-gradient-to-r from-hogwarts-bg to-[#1f1d20] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/owl')}
            className="min-w-0 text-left"
          >
            <div className="flex items-center gap-2 text-hogwarts-gold">
              <span className="text-xl" aria-hidden="true">⚡</span>
              <h2 className="font-magical text-xl tracking-widest leading-none">猫头鹰邮局</h2>
            </div>
            <p className="mt-1 text-[10px] text-hogwarts-paper/50 font-serif italic">魔法即时通讯</p>
          </button>

          <div className="flex items-center gap-0.5">
            <HeaderIconButton
              label="猫头鹰通讯器"
              onClick={() => navigate('/app/owl-ping')}
            >
              <Smartphone className="h-4 w-4" aria-hidden="true" />
            </HeaderIconButton>
            <HeaderIconButton
              label="公告栏"
              hasUnread={hasNewAnnouncement}
              onClick={() => { setNoticePage(0); openPanel('announcements'); }}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
            </HeaderIconButton>
            <HeaderIconButton
              label="入学手册 (更新日志)"
              hasUnread={hasNewManual}
              onClick={() => openPanel('manual')}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </HeaderIconButton>
          </div>
        </div>
        </div>

        <div className="grid grid-cols-3 border-b border-hogwarts-goldDark/30">
          <button
            type="button"
            onClick={() => navigate('/app/vault')}
            className="flex min-h-[74px] items-center justify-center gap-2 border-r border-hogwarts-goldDark/30 px-2 py-3 text-left transition-colors hover:bg-white/5"
          >
            <Coins className="h-5 w-5 text-amber-300" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm text-hogwarts-paper/70">巫师银行</span>
              <span className="block text-base font-bold text-hogwarts-gold">金库 {balance} G</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/diagon-alley')}
            className="flex min-h-[74px] items-center justify-center gap-2 border-r border-hogwarts-goldDark/30 px-2 py-3 text-left transition-colors hover:bg-white/5"
          >
            <ShoppingBag className="h-5 w-5 text-hogwarts-gold" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm text-hogwarts-paper/70">对角巷</span>
              <span className="block text-xs text-hogwarts-paper/40">商店与道具</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/news')}
            className="flex min-h-[74px] items-center justify-center gap-2 px-2 py-3 text-left transition-colors hover:bg-white/5"
          >
            <Newspaper className="h-5 w-5 text-amber-100" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm text-hogwarts-paper/70">每日新闻</span>
              <span className="block text-xs text-hogwarts-paper/40">魔法报纸</span>
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden px-3 py-3">
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <SidebarSectionTitle title="魔法群聊" />
              <button
                type="button"
                title="创建新群聊"
                aria-label="创建新群聊"
                className="rounded-md px-2 py-1 text-lg leading-none text-hogwarts-gold transition-colors hover:bg-white/5 hover:text-white"
              >
                +
              </button>
            </div>
            <p className="px-1 text-xs text-hogwarts-paper/35">暂无群聊</p>
          </div>

          <div className="mb-3">
            <div className="mb-2 flex items-center justify-between">
              <SidebarSectionTitle title="巫师列表" />
              <span className="text-[11px] text-hogwarts-paper/30">{sortedCharacters.length}</span>
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hogwarts-paper/30" aria-hidden="true" />
              <input
                className="h-10 w-full rounded-lg border border-hogwarts-goldDark/30 bg-black/35 pl-9 pr-3 text-sm text-hogwarts-paper placeholder:text-hogwarts-paper/30 outline-none transition-colors focus:border-hogwarts-gold/50"
                placeholder="搜索角色..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>

          <div className="h-[calc(100%-92px)] overflow-y-auto pr-1">
            {charactersLoading ? (
              <p className="py-8 text-center text-sm text-hogwarts-paper/35">正在整理通讯录...</p>
            ) : sortedCharacters.length === 0 ? (
              <p className="py-8 text-center text-sm text-hogwarts-paper/35">没有匹配的巫师</p>
            ) : (
              <div className="space-y-1">
                {sortedCharacters.map((character) => {
                  const isActive = selectedCharacter?.id === character.id && location.pathname.includes('/app/owl');
                  const starred = Boolean(starredCharacters[character.id]);
                  const subtitle = [character.grade, character.title || character.house].filter(Boolean).join(' | ');

                  return (
                    <div
                      key={character.id}
                      className={`group flex items-center gap-2 rounded-lg border px-2 py-2 transition-all ${
                        isActive
                          ? 'border-hogwarts-gold/45 bg-hogwarts-gold/15 border-l-2 border-l-hogwarts-gold'
                          : 'border-transparent hover:border-hogwarts-goldDark/30 hover:bg-white/5'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectCharacter(character)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        {character.avatarUrl ? (
                          <img
                            src={character.avatarUrl}
                            alt=""
                            className="h-11 w-11 shrink-0 rounded-full border border-hogwarts-gold/25 object-cover"
                          />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-hogwarts-gold/30 bg-hogwarts-gold/10 text-hogwarts-gold">
                            {character.name.slice(0, 1)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-hogwarts-paper">{character.name}</span>
                          <span className="block truncate text-xs text-hogwarts-paper/40">{subtitle || '霍格沃茨巫师'}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        title={starred ? '取消星标' : '添加星标'}
                        aria-label={starred ? '取消星标' : '添加星标'}
                        onClick={() => toggleStar(character.id)}
                        className={`shrink-0 rounded-md p-1 transition-colors ${
                          starred
                            ? 'text-hogwarts-gold'
                            : 'text-hogwarts-paper/25 opacity-0 group-hover:opacity-100 hover:text-hogwarts-gold'
                        }`}
                      >
                        <Star className="h-4 w-4" fill={starred ? 'currentColor' : 'none'} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-hogwarts-goldDark/30 bg-black/35">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => navigate('/app/profile')}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-hogwarts-gold/45 bg-hogwarts-gold/10 text-hogwarts-gold">
                <CircleUserRound className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-hogwarts-paper">{displayName}</span>
                <span className="block truncate text-xs text-hogwarts-paper/40">
                  {[house || '未分院', grade || '新生', wizardTitle].filter(Boolean).join(' · ')}
                </span>
              </span>
            </button>
            <button
              type="button"
              title="魔法设置"
              aria-label="魔法设置"
              onClick={() => navigate('/app/settings')}
              className="rounded-md p-2 text-hogwarts-paper/45 transition-colors hover:bg-white/5 hover:text-hogwarts-gold"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              title="退出登录"
              aria-label="退出登录"
              className="rounded-md p-2 text-hogwarts-paper/45 transition-colors hover:bg-red-500/10 hover:text-red-300"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <nav className="grid border-t border-hogwarts-goldDark/20" style={{ gridTemplateColumns: `repeat(${bottomNavItems.length}, minmax(0, 1fr))` }}>
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex min-h-[62px] flex-col items-center justify-center gap-1 px-1 text-center text-[11px] transition-colors ${
                      isActive ? 'text-hogwarts-gold' : 'text-hogwarts-paper/45 hover:bg-white/5 hover:text-hogwarts-gold'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="max-w-full truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="relative z-10 min-w-0 flex-1 overflow-y-auto pb-[calc(5.75rem+env(safe-area-inset-bottom))] xl:pb-4">
        <div className="mx-auto w-full max-w-[1720px] px-3 py-3 sm:px-4 lg:px-5 2xl:px-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-hogwarts-goldDark/20 bg-black/88 pb-[env(safe-area-inset-bottom)] backdrop-blur-md xl:hidden">
        <div className="flex overflow-x-auto px-2 py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-[50px] min-w-[68px] flex-col items-center justify-center gap-1 rounded-md px-2 text-[11px] transition-colors sm:min-w-[82px] sm:text-xs ${
                    isActive ? 'text-hogwarts-gold' : 'text-hogwarts-paper/50'
                  }`
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <NoticeBoardDialog
        isOpen={activePanel === 'announcements'}
        page={noticePage}
        onPageChange={setNoticePage}
        onClose={() => setActivePanel(null)}
      />
      <GuideManualDialog
        isOpen={activePanel === 'manual'}
        onClose={() => setActivePanel(null)}
      />
      <VersionCheckDialog
        isOpen={showVersionCheck}
        onConfirm={() => { localStorage.setItem('hp_version_confirmed', '1'); setShowVersionCheck(false); }}
      />
      {showOnboarding && <OnboardingGuide onComplete={() => setShowOnboarding(false)} />}
    </div>
  );
}

function HeaderIconButton({
  children,
  label,
  hasUnread = false,
  onClick,
}: {
  children: ReactNode;
  label: string;
  hasUnread?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`relative rounded-md p-1.5 transition-colors hover:bg-white/5 hover:text-white ${
        hasUnread ? 'animate-pulse text-red-300' : 'text-hogwarts-gold'
      }`}
    >
      {children}
      {hasUnread && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
      )}
    </button>
  );
}

function SidebarSectionTitle({ title }: { title: string }) {
  return <h3 className="px-1 text-xs font-medium text-hogwarts-gold/70">{title}</h3>;
}

// ── 公告栏弹窗 ──
function NoticeBoardDialog({
  isOpen,
  page,
  onPageChange,
  onClose,
}: {
  isOpen: boolean;
  page: number;
  onPageChange: (p: number) => void;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#f4e4d0] bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] w-full max-w-2xl rounded-lg shadow-[0_0_60px_rgba(255,200,0,0.4)] border-8 border-amber-800/80 relative overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-amber-900/20 hover:bg-amber-900/40 text-amber-900 transition-colors z-10"
        >
          ✕
        </button>
        <div className="p-8 pt-16">
          <div className="text-center mb-6 border-b-2 border-amber-900/30 pb-4">
            <h2 className="text-3xl font-magical text-red-800 tracking-widest mb-2">
              公告栏
            </h2>
            <p className="text-sm text-amber-900/70 font-serif italic">
              Notice Board
            </p>
          </div>
          <div className="py-16 text-center text-amber-900/45 font-serif">
            暂无公告
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── 入学手册（更新日志）弹窗 ──
function GuideManualDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-hogwarts-paper bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] w-full max-w-3xl rounded-lg shadow-[0_0_40px_rgba(197,160,89,0.3)] border-4 border-hogwarts-goldDark relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-hogwarts-goldDark/90 p-4 text-center border-b-2 border-hogwarts-gold flex-shrink-0 relative">
          <h2 className="text-xl md:text-2xl font-magical text-hogwarts-paper tracking-widest leading-relaxed">
            入学手册
          </h2>
          <p className="text-xs md:text-sm text-hogwarts-paper/80 font-serif italic">
            Hogwarts Manual
          </p>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-hogwarts-paper hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-12 text-center text-hogwarts-goldDark/55 font-serif">
          暂无内容
        </div>
      </motion.div>
    </div>
  );

}

// ── 版本检测弹窗 ──
function VersionCheckDialog({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-hogwarts-bg border border-hogwarts-gold/50 rounded-lg shadow-2xl w-[90%] max-w-md overflow-hidden"
      >
        <div className="p-4 border-b border-hogwarts-gold/30 text-center bg-gradient-to-b from-hogwarts-gold/10 to-transparent">
          <h3 className="font-magical text-xl text-hogwarts-gold">✅ 版本检测</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-black/30 rounded-lg p-3">
              <span className="text-gray-400">最新版本:</span>
              <span className="font-mono text-green-400">{APP_VERSION} ({APP_VERSION_HASH})</span>
            </div>
            <div className="flex justify-between items-center bg-black/30 rounded-lg p-3">
              <span className="text-gray-400">您的版本:</span>
              <span className="font-mono text-green-400">{APP_VERSION_HASH}</span>
            </div>
          </div>
          <div className="text-center p-4 bg-green-900/30 rounded-lg border border-green-600/30">
            <p className="text-green-300">🎉 您的版本是最新的！</p>
          </div>
        </div>
        <div className="p-4 border-t border-hogwarts-gold/30 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-lg bg-hogwarts-gold text-black font-bold hover:bg-hogwarts-gold/80 transition-colors"
          >
            确认进入
          </button>
        </div>
      </motion.div>
    </div>
  );
}
