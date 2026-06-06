import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { authApi } from '../api/endpoints';
import MagicLoadingScreen from '../components/MagicLoadingScreen';
import ThreeLaunchScene from '../components/ThreeLaunchScene';
import { useAuthStore } from '../stores/authStore';
import { installAudioUnlock } from '../utils/audioUnlock';

type LoginState = 'idle' | 'checking' | 'entering' | 'failed';

interface FieldErrors {
  email?: string;
  password?: string;
}

const LOGIN_THEME_SRC = '/audio/launch-theme.mp3';
const LOGIN_BACKGROUND_SRC = '/images/login-bg.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginState, setLoginState] = useState<LoginState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [skipAnim, setSkipAnim] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const cleanupUnlock = installAudioUnlock({
      getAudio: () => audioRef.current,
      volume: 0.28,
      onPlaying: () => setMusicEnabled(true),
    });

    audio.loop = true;
    audio.volume = 0.28;
    audio.play().catch(() => {
      setMusicEnabled(false);
    });

    return () => {
      cleanupUnlock();
      if (fadeTimerRef.current) {
        window.clearInterval(fadeTimerRef.current);
      }
      audio.pause();
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
      fadeAudioTo(0.28);
    } catch (error) {
      console.warn('登录页背景音乐需要用户点击后播放', error);
    }
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = '请输入你的魔法邮箱';
    if (!password) errors.password = '请输入通行密语';
    else if (password.length < 6) errors.password = '通行密语至少 6 位';
    return errors;
  };

  const handleLogin = async () => {
    const fe = validate();
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) {
      setLoginState('failed');
      setErrorMsg('请检查填写的信息');
      return;
    }

    setLoginState('checking');
    setErrorMsg('');

    try {
      const res = await authApi.login(email, password);
      const { accessToken, refreshToken, user } = res.data;

      setLoginState('entering');
      if (!skipAnim) {
        await new Promise((resolve) => setTimeout(resolve, 900));
      }

      setTokens(accessToken, refreshToken);
      setUser(user);
      navigate('/app/owl', { replace: true });
    } catch (err: any) {
      setLoginState('failed');
      setErrorMsg(err.response?.data?.message || err.message || '墙壁没有让你通过，请检查邮箱或密码');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (loginState === 'failed') {
      setLoginState('idle');
      setErrorMsg('');
      setFieldErrors({});
    }
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (loginState === 'failed') {
      setLoginState('idle');
      setErrorMsg('');
      setFieldErrors({});
    }
    setPassword(e.target.value);
  };

  const formDisabled = loginState === 'checking' || loginState === 'entering';

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#15110e] px-4 py-[calc(4rem+env(safe-area-inset-top))] sm:px-6">
      <audio ref={audioRef} src={LOGIN_THEME_SRC} preload="auto" />
      <ThreeLaunchScene src={LOGIN_BACKGROUND_SRC} variant="login" />
      <button
        type="button"
        onClick={toggleMusic}
        className="fixed right-3 top-3 z-50 inline-flex h-11 w-11 items-center justify-center border border-[#d7b66b]/35 bg-[#140f0b]/70 text-[#ffe1a3] shadow-[0_0_24px_rgba(215,182,107,0.18)] backdrop-blur transition hover:bg-[#d7b66b] hover:text-[#130d08] focus:outline-none focus:ring-2 focus:ring-[#ffe1a3]/60 sm:right-5 sm:top-5"
        aria-label={musicEnabled ? '关闭背景音乐' : '播放背景音乐'}
        title={musicEnabled ? '关闭背景音乐' : '播放背景音乐'}
      >
        {musicEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {(loginState === 'checking' || loginState === 'entering') && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute text-6xl"
              initial={{ left: '-10%', top: '20%' }}
              animate={{ left: '110%', top: ['20%', '30%', '15%'], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            >
              🦉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(loginState === 'checking' || loginState === 'entering') && (
          <MagicLoadingScreen
            visible
            compact
            label={loginState === 'checking' ? '正在核验霍格莫德车票...' : '正在抵达霍格莫德车站...'}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="relative z-10 w-full max-w-md sm:max-w-lg xl:max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="mb-8 text-center"
          animate={loginState === 'entering' ? { scale: 1.06, opacity: 0.8 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="mb-3 inline-block text-5xl"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🚂
          </motion.div>
          <h1 className="mb-1 font-display text-3xl tracking-wide text-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] sm:text-4xl">
            九又四分之三站台
          </h1>
          <p className="text-sm text-parchment/75">Platform 9¾</p>
          <p className="mt-1 text-sm text-parchment/80">出示你的车票，进入猫头鹰邮局</p>
        </motion.div>

        <motion.div
          className="rounded-lg border border-hogwarts-gold/55 bg-black/75 p-4 shadow-[0_0_32px_rgba(197,160,89,0.18)] backdrop-blur-sm"
          animate={
            loginState === 'entering'
              ? { scale: 0.95, opacity: 0.7, filter: 'blur(1px)' }
              : loginState === 'failed'
                ? { x: [-10, 10, -10, 10, 0] }
                : {}
          }
          transition={{ duration: loginState === 'failed' ? 0.4 : 0.6 }}
        >
          <div className="mb-4">
            <input
              className={`input-field ${fieldErrors.email ? 'border-red-400 focus:border-red-400' : ''}`}
              type="email"
              placeholder="你的魔法邮箱"
              value={loginState === 'entering' ? '' : email}
              onChange={handleEmailChange}
              disabled={formDisabled}
            />
            {fieldErrors.email && <p className="ml-1 mt-1 text-xs text-red-300">{fieldErrors.email}</p>}
          </div>

          <div className="mb-6">
            <input
              className={`input-field ${fieldErrors.password ? 'border-red-400 focus:border-red-400' : ''}`}
              type="password"
              placeholder="通行密语（至少 6 位）"
              value={loginState === 'entering' ? '' : password}
              onChange={handlePasswordChange}
              disabled={formDisabled}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {fieldErrors.password && <p className="ml-1 mt-1 text-xs text-red-300">{fieldErrors.password}</p>}
          </div>

          {errorMsg && (
            <motion.p className="mb-4 text-center text-sm text-red-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {errorMsg}
            </motion.p>
          )}

          <motion.button
            className="btn-primary w-full text-lg"
            onClick={handleLogin}
            disabled={formDisabled}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loginState === 'checking'
              ? '🦉 正在核验车票...'
              : loginState === 'entering'
                ? '🚂 穿过墙壁...'
                : '🧱 穿过墙壁'}
          </motion.button>

          {loginState === 'checking' && !skipAnim && (
            <p className="mt-2 text-center">
              <button
                type="button"
                className="text-xs text-parchment/70 transition-colors hover:text-parchment"
                onClick={() => setSkipAnim(true)}
              >
                跳过动画 →
              </button>
            </p>
          )}

          {loginState === 'failed' && (
            <motion.p className="mt-2 text-center text-xs text-parchment/75" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              修改上方信息后会自动清除错误状态
            </motion.p>
          )}

          <div className="mt-4 flex flex-col items-center gap-2 text-sm">
            <Link to="/register" className="text-gold transition-colors hover:text-gold-light">
              还没有车票？领取入学信
            </Link>
            <Link to="/forgot-password" className="text-parchment/75 transition-colors hover:text-parchment">
              弄丢了通行密语？
            </Link>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-xs text-parchment/60">v0.1 · 魔法法典 · 重建版</p>
      </motion.div>
    </div>
  );
}
