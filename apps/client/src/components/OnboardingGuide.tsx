import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    icon: '🦉',
    title: '欢迎来到猫头鹰邮局',
    desc: '这里是霍格沃茨的魔法即时通讯世界。你可以和熟悉的角色聊天、赚取金币、参与学院杯！',
  },
  {
    icon: '🧙',
    title: '选择一个角色',
    desc: '从左边的角色列表中选择一位巫师，开始你们的第一次对话吧！',
  },
  {
    icon: '💰',
    title: '领取你的第一笔金币',
    desc: '去古灵阁金库签到，领取每日津贴。金币可以用来在对角巷购买各种神奇商品！',
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingGuide({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('hp_onboarding_completed', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hp_onboarding_completed', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="card max-w-md w-full mx-4 text-center"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-6xl mb-4">{current.icon}</div>
          <h2 className="font-display text-2xl text-gold mb-2">{current.title}</h2>
          <p className="text-parchment/60 text-sm leading-relaxed mb-6">
            {current.desc}
          </p>

          {/* 步骤指示器 */}
          <div className="flex justify-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'bg-gold w-6' : 'bg-parchment/20'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <button className="btn-ghost text-sm" onClick={handleSkip}>
              跳过引导
            </button>
            <button className="btn-primary text-sm" onClick={handleNext}>
              {step < STEPS.length - 1 ? '下一步 →' : '✨ 开始冒险'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
