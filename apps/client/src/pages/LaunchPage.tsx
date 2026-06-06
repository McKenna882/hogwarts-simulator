import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Castle, DoorOpen, Sparkles, Ticket, TrainFront, Volume2, VolumeX } from 'lucide-react';
import MagicLoadingScreen from '../components/MagicLoadingScreen';
import ThreeLaunchScene from '../components/ThreeLaunchScene';
import { useAuthStore } from '../stores/authStore';

type LaunchStage = 'station' | 'transition' | 'academy';

const LAUNCH_THEME_SRC = '/audio/launch-theme.mp3';
const LAUNCH_BACKGROUND_SRC = '/images/launch-bg.png';

export default function LaunchPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.accessToken);
  const [stage, setStage] = useState<LaunchStage>('station');
  const [musicEnabled, setMusicEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) {
        window.clearInterval(fadeTimerRef.current);
      }
    };
  }, []);

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

  const playLaunchTheme = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = 0;
    try {
      await audio.play();
      setMusicEnabled(true);
      fadeAudioTo(0.42);
    } catch (error) {
      console.warn('启动页背景音乐需要用户点击后播放', error);
    }
  };

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicEnabled) {
      audio.pause();
      setMusicEnabled(false);
      return;
    }
    await playLaunchTheme();
  };

  const enterWall = () => {
    if (!musicEnabled) {
      void playLaunchTheme();
    }
    setStage('transition');
    window.setTimeout(() => setStage('academy'), 1650);
  };

  const enterAcademy = () => {
    navigate(token ? '/app/owl' : '/login');
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#100d0b] text-parchment">
      <audio ref={audioRef} src={LAUNCH_THEME_SRC} preload="auto" />
      <button
        type="button"
        onClick={toggleMusic}
        className="fixed right-3 top-3 z-[70] inline-flex h-11 w-11 items-center justify-center border border-[#d7b66b]/35 bg-[#140f0b]/70 text-[#ffe1a3] shadow-[0_0_24px_rgba(215,182,107,0.18)] backdrop-blur transition hover:bg-[#d7b66b] hover:text-[#130d08] focus:outline-none focus:ring-2 focus:ring-[#ffe1a3]/60 sm:right-5 sm:top-5"
        aria-label={musicEnabled ? '关闭背景音乐' : '播放背景音乐'}
        title={musicEnabled ? '关闭背景音乐' : '播放背景音乐'}
      >
        {musicEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>
      <AnimatePresence mode="wait">
        {stage !== 'academy' ? (
          <motion.section
            key="station"
            className="absolute inset-0 isolate flex min-h-dvh items-end justify-center overflow-hidden px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-20 sm:items-center sm:px-6 sm:pb-10 lg:px-8"
            initial={{ opacity: 0 }}
            animate={{
              opacity: stage === 'transition' ? 0.35 : 1,
              scale: stage === 'transition' ? 1.08 : 1,
              filter: stage === 'transition' ? 'blur(5px)' : 'blur(0px)',
            }}
            exit={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
          >
            <StationBackdrop stage={stage} />

            <div className="relative z-20 grid w-full max-w-7xl items-end gap-5 sm:gap-8 md:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] xl:grid-cols-[minmax(0,1fr)_420px]">
              <motion.div
                className="max-w-2xl pb-4"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7 }}
              >
                <div className="mb-5 inline-flex items-center gap-2 border border-[#d7b66b]/35 bg-[#140f0b]/70 px-4 py-2 text-sm text-[#f1d28b] shadow-[0_0_28px_rgba(215,182,107,0.16)] backdrop-blur">
                  <Ticket className="h-4 w-4" />
                  Platform 9 3/4
                </div>
                <h1 className="font-magical text-4xl leading-tight text-[#ffe1a3] drop-shadow-[0_8px_28px_rgba(0,0,0,0.55)] sm:text-6xl md:text-7xl 2xl:text-8xl">
                  九又四分之三站台
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-[#f5e6c4]/72 sm:mt-5 sm:text-lg sm:leading-7">
                  蒸汽列车已经靠站，砖墙后方的路会把你带向霍格莫德车站的雾与灯火。
                </p>
              </motion.div>

              <motion.div
                className="border border-[#d7b66b]/35 bg-[#17100a]/82 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.46)] backdrop-blur-md sm:p-5"
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.7 }}
              >
                <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#d7b66b]/20 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[#d7b66b]/62">Departure</p>
                    <p className="mt-1 font-magical text-2xl text-[#ffe1a3]">Hogwarts Express</p>
                  </div>
                  <TrainFront className="h-10 w-10 text-[#d7b66b]" />
                </div>

                <div className="space-y-3 text-sm text-[#f5e6c4]/68">
                  <div className="flex items-center justify-between border border-white/10 bg-black/20 px-3 py-3">
                    <span>站台</span>
                    <span className="font-magical text-xl text-[#ffe1a3]">9 3/4</span>
                  </div>
                  <div className="flex items-center justify-between border border-white/10 bg-black/20 px-3 py-3">
                    <span>目的地</span>
                    <span className="text-[#f1d28b]">霍格莫德车站</span>
                  </div>
                </div>

                <button
                  className="mt-6 flex w-full items-center justify-center gap-3 bg-[#d7b66b] px-5 py-4 font-bold text-[#130d08] shadow-[0_0_30px_rgba(215,182,107,0.28)] transition hover:bg-[#ffe1a3] focus:outline-none focus:ring-2 focus:ring-[#ffe1a3]/60 active:scale-[0.98]"
                  onClick={enterWall}
                  disabled={stage === 'transition'}
                >
                  <DoorOpen className="h-5 w-5" />
                  穿过砖墙
                  <ArrowRight className="h-5 w-5" />
                </button>
              </motion.div>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="academy"
            className="relative flex min-h-dvh items-end overflow-hidden px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-20 sm:items-center sm:px-6 sm:pb-12 lg:px-8"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <motion.div
              className="absolute inset-0 z-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              <ThreeLaunchScene src={LAUNCH_BACKGROUND_SRC} variant="station" />
            </motion.div>
            <div className="relative z-10 w-full max-w-6xl">
              <motion.div
                className="max-w-2xl"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.7 }}
              >
                <div className="mb-5 inline-flex items-center gap-2 border border-[#d7b66b]/35 bg-black/35 px-4 py-2 text-sm text-[#f1d28b] backdrop-blur">
                  <Castle className="h-4 w-4" />
                  Hogsmeade Station
                </div>
                <h2 className="font-magical text-4xl leading-tight text-[#ffe1a3] sm:text-6xl md:text-7xl 2xl:text-8xl">
                  霍格莫德车站
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-[#f5e6c4]/72 sm:text-lg">
                  站台尽头已经亮起暖灯。你的猫头鹰邮局、金库、社团与学院生活都在下一班马车后等候。
                </p>
                <button
                  className="mt-8 inline-flex min-w-48 items-center justify-center gap-3 bg-[#d7b66b] px-6 py-4 font-bold text-[#130d08] shadow-[0_0_32px_rgba(215,182,107,0.28)] transition hover:bg-[#ffe1a3] focus:outline-none focus:ring-2 focus:ring-[#ffe1a3]/60 active:scale-[0.98]"
                  onClick={enterAcademy}
                >
                  <Sparkles className="h-5 w-5" />
                  进入学院
                </button>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {stage === 'transition' && <TransitionFog />}
      <AnimatePresence>
        {stage === 'transition' && <MagicLoadingScreen visible label="正在抵达霍格莫德车站..." />}
      </AnimatePresence>
    </main>
  );
}

function StationBackdrop({ stage }: { stage: LaunchStage }) {
  const isTransitioning = stage === 'transition';

  return (
    <>
      <motion.div
        className="absolute inset-0 overflow-hidden bg-[#100d0b]"
        animate={{ scale: isTransitioning ? 1.12 : 1 }}
        transition={{ duration: 1.55, ease: 'easeInOut' }}
      >
        <ThreeLaunchScene src={LAUNCH_BACKGROUND_SRC} variant="station" />
      </motion.div>
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.58))]" />
    </>
  );
}

function TransitionFog() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_50%_50%,rgba(255,238,196,0.92),rgba(220,188,127,0.72)_34%,rgba(17,12,10,0.92)_78%)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 1.65, ease: 'easeInOut' }}
    />
  );
}
