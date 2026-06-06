import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Feather, Mail, ScrollText, Sparkles, Wand2 } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { useAuthStore } from '../stores/authStore';

type RegisterState = 'idle' | 'validating' | 'sealing' | 'failed';

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [registerState, setRegisterState] = useState<RegisterState>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = '请写下能收到猫头鹰邮递的邮箱';
    if (!password) errors.password = '请设置通行密语';
    else if (password.length < 6) errors.password = '通行密语至少需要 6 位';
    if (!confirmPassword) errors.confirmPassword = '请再次确认通行密语';
    else if (password !== confirmPassword) errors.confirmPassword = '两次输入的通行密语不一致';
    return errors;
  };

  const clearFailure = () => {
    if (registerState === 'failed') {
      setRegisterState('idle');
      setError('');
    }
  };

  const handleRegister = async () => {
    const errors = validate();
    setFieldErrors(errors);
    setError('');

    if (Object.keys(errors).length > 0) {
      setRegisterState('failed');
      setError('还有几处墨迹需要补全');
      return;
    }

    setRegisterState('validating');
    try {
      const res = await authApi.register(email.trim(), password, referralCode.trim() || undefined);
      const data = res.data?.data || res.data;
      const { accessToken, refreshToken, user } = data;
      setRegisterState('sealing');
      await new Promise((resolve) => setTimeout(resolve, 700));
      setTokens(accessToken, refreshToken);
      setUser(user);
      navigate('/app/owl', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '入学登记失败，请稍后再试');
      setRegisterState('failed');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearFailure();
    setFieldErrors((prev) => ({ ...prev, email: undefined }));
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearFailure();
    setFieldErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined }));
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearFailure();
    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    setConfirmPassword(e.target.value);
  };

  const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearFailure();
    setReferralCode(e.target.value);
  };

  const formDisabled = registerState === 'validating' || registerState === 'sealing';
  const progressSteps = [
    { label: '邮箱', active: Boolean(email.trim()) },
    { label: '密语', active: password.length >= 6 },
    { label: '确认', active: Boolean(confirmPassword) && password === confirmPassword },
  ];

  const buttonText = () => {
    if (registerState === 'validating') return '正在校验入学名册...';
    if (registerState === 'sealing') return '火漆封印完成...';
    return '寄出入学登记';
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#17120e] px-4 py-[calc(4rem+env(safe-area-inset-top))] text-parchment sm:px-8 lg:px-10">
      <div className="register-sparkles absolute inset-0" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(197,160,89,0.2),transparent_30%),radial-gradient(circle_at_82%_72%,rgba(82,39,39,0.28),transparent_34%),linear-gradient(135deg,rgba(14,10,7,0.22),rgba(0,0,0,0.56))]"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#5b1f1f]/22 to-transparent" aria-hidden="true" />

      <Link
        to="/login"
        className="fixed left-3 top-3 z-30 inline-flex h-11 w-11 items-center justify-center border border-gold/35 bg-[#130d09]/70 text-gold shadow-[0_0_24px_rgba(197,160,89,0.16)] backdrop-blur transition hover:bg-gold hover:text-[#130d09] focus:outline-none focus:ring-2 focus:ring-gold-light/60 sm:left-5 sm:top-5"
        aria-label="返回登录"
        title="返回登录"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <main className="relative z-10 mx-auto grid min-h-[calc(100dvh-8rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <motion.section
          className="hidden lg:block"
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75 }}
        >
          <div className="relative mx-auto max-w-md">
            <motion.div
              className="register-letter relative min-h-[560px] border border-[#805f2d]/45 bg-[#ddc69a] p-8 text-[#2f2115] shadow-[0_30px_90px_rgba(0,0,0,0.42)]"
              animate={{ y: [0, -5, 0], rotate: [-0.4, 0.35, -0.4] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="absolute inset-4 border border-[#815d29]/25" aria-hidden="true" />
              <div className="relative">
                <div className="mb-7 flex items-center justify-between">
                  <div>
                    <p className="font-display text-sm uppercase tracking-[0.28em] text-[#6f261f]">Hogwarts</p>
                    <h1 className="mt-2 font-display text-4xl leading-tight text-[#24170e]">入学登记</h1>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#7a251f]/45 bg-[#7a251f] text-[#f3d78d] shadow-[inset_0_0_18px_rgba(0,0,0,0.35)]">
                    <Feather className="h-8 w-8" />
                  </div>
                </div>

                <div className="mb-7 h-px bg-[#6f4a22]/35" />
                <p className="font-display text-2xl leading-snug text-[#332015]">
                  亲爱的新生，城堡已为你留下一盏灯。
                </p>
                <p className="mt-5 text-sm leading-7 text-[#4c3825]">
                  请完成右侧登记。魔法邮箱会成为你的信箱，通行密语会打开通往猫头鹰邮局的门。
                </p>

                <div className="mt-9 space-y-4">
                  {progressSteps.map((step, index) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <motion.span
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${
                          step.active
                            ? 'border-[#7a251f] bg-[#7a251f] text-[#f4dfaa]'
                            : 'border-[#765934]/45 text-[#765934]'
                        }`}
                        animate={step.active ? { scale: [1, 1.12, 1] } : {}}
                        transition={{ duration: 0.45 }}
                      >
                        {index + 1}
                      </motion.span>
                      <span className={step.active ? 'font-semibold text-[#2f2115]' : 'text-[#6d5333]'}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="absolute -bottom-16 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-[#7a251f] shadow-[inset_0_0_18px_rgba(0,0,0,0.38),0_8px_22px_rgba(80,20,20,0.35)]" aria-hidden="true">
                  <div className="absolute inset-5 rounded-full border border-[#f4d78a]/45" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="mx-auto w-full max-w-xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-6 text-center lg:text-left">
            <motion.div
              className="mb-4 inline-flex h-16 w-16 items-center justify-center border border-gold/45 bg-black/45 text-gold shadow-[0_0_28px_rgba(197,160,89,0.18)] backdrop-blur"
              animate={{ rotate: [0, -3, 3, 0], y: [0, -3, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ScrollText className="h-8 w-8" />
            </motion.div>
            <h1 className="font-display text-3xl leading-tight text-gold drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] sm:text-5xl">
              领取你的入学信
            </h1>
            <p className="mt-3 text-sm leading-6 text-parchment/72">
              墨水落定之后，第一封信会直达猫头鹰邮局。
            </p>
          </div>

          <motion.div
            className="relative overflow-hidden border border-gold/45 bg-black/72 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.45),0_0_35px_rgba(197,160,89,0.12)] backdrop-blur-md sm:p-6"
            animate={
              registerState === 'failed'
                ? { x: [-8, 8, -6, 6, 0] }
                : registerState === 'sealing'
                  ? { scale: 0.98, filter: 'sepia(0.25)' }
                  : {}
            }
            transition={{ duration: registerState === 'failed' ? 0.38 : 0.55 }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/80 to-transparent" aria-hidden="true" />
            <AnimatePresence>
              {registerState === 'sealing' && (
                <motion.div
                  className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#120d09]/78 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="flex h-28 w-28 items-center justify-center rounded-full border border-[#f4d78a]/45 bg-[#7a251f] text-[#f6dda1] shadow-[0_0_42px_rgba(197,160,89,0.28),inset_0_0_22px_rgba(0,0,0,0.36)]"
                    initial={{ scale: 1.7, rotate: -18 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 15 }}
                  >
                    <Sparkles className="h-10 w-10" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {progressSteps.map((step) => (
                <div key={step.label} className="h-1.5 overflow-hidden rounded-full bg-parchment/12">
                  <motion.div
                    className="h-full rounded-full bg-gold"
                    initial={false}
                    animate={{ width: step.active ? '100%' : '0%' }}
                    transition={{ duration: 0.35 }}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs text-parchment/62">
                  <Mail className="h-3.5 w-3.5 text-gold/80" />
                  魔法邮箱
                </label>
                <input
                  className={`input-field ${fieldErrors.email ? 'border-red-400 focus:border-red-400' : ''}`}
                  type="email"
                  placeholder="name@owlpost.example"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={formDisabled}
                  autoComplete="email"
                />
                {fieldErrors.email && <p className="ml-1 mt-1 text-xs text-red-300">{fieldErrors.email}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs text-parchment/62">通行密语</label>
                  <input
                    className={`input-field ${fieldErrors.password ? 'border-red-400 focus:border-red-400' : ''}`}
                    type="password"
                    placeholder="至少 6 位"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={formDisabled}
                    autoComplete="new-password"
                  />
                  {fieldErrors.password && <p className="ml-1 mt-1 text-xs text-red-300">{fieldErrors.password}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-xs text-parchment/62">确认密语</label>
                  <input
                    className={`input-field ${fieldErrors.confirmPassword ? 'border-red-400 focus:border-red-400' : ''}`}
                    type="password"
                    placeholder="再次输入"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    disabled={formDisabled}
                    autoComplete="new-password"
                    onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="ml-1 mt-1 text-xs text-red-300">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs text-parchment/62">推荐码</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="可选"
                  value={referralCode}
                  onChange={handleReferralCodeChange}
                  disabled={formDisabled}
                />
              </div>
            </div>

            {error && (
              <motion.p
                className="mt-4 border border-red-300/25 bg-red-950/28 px-4 py-3 text-center text-sm text-red-200"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}

            <motion.button
              className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 text-lg"
              onClick={handleRegister}
              disabled={formDisabled}
              whileHover={{ scale: formDisabled ? 1 : 1.015 }}
              whileTap={{ scale: formDisabled ? 1 : 0.985 }}
            >
              <Wand2 className="h-5 w-5" />
              {buttonText()}
            </motion.button>

            <div className="mt-5 text-center text-sm">
              <p className="text-parchment/58">
                已经登记过？
                <Link to="/login" className="ml-1 text-gold transition-colors hover:text-gold-light">
                  返回九又四分之三站台
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
}
