import { motion } from 'framer-motion';
import { TrainFront } from 'lucide-react';

interface MagicLoadingScreenProps {
  visible: boolean;
  label?: string;
  compact?: boolean;
}

export default function MagicLoadingScreen({
  visible,
  label = '正在抵达霍格莫德车站...',
  compact = false,
}: MagicLoadingScreenProps) {
  if (!visible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`relative overflow-hidden border border-[#d7b66b]/45 bg-[#17100a]/86 text-center text-[#f5e6c4] shadow-[0_0_60px_rgba(215,182,107,0.18)] backdrop-blur-md ${
          compact ? 'w-[min(88vw,320px)] px-5 py-5' : 'w-[min(90vw,420px)] px-6 py-7'
        }`}
        initial={{ y: 18, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,225,163,0.2),transparent_42%)]" />
        <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#d7b66b]/40 bg-[#d7b66b]/12 text-[#ffe1a3]">
          <TrainFront className="h-7 w-7" />
        </div>
        <p className="relative font-magical text-xl tracking-wider text-[#ffe1a3]">{label}</p>
        <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full w-1/2 rounded-full bg-[#d7b66b]"
            animate={{ x: ['-110%', '220%'] }}
            transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <p className="relative mt-3 text-xs uppercase tracking-[0.24em] text-[#f5e6c4]/45">Hogsmeade Station</p>
      </motion.div>
    </motion.div>
  );
}
