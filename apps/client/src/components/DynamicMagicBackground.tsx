import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const motes = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${6 + ((index * 29) % 88)}%`,
  top: `${8 + ((index * 17) % 78)}%`,
  size: 2 + (index % 4),
  delay: (index % 6) * 0.55,
}));

interface DynamicMagicBackgroundProps {
  src: string;
  className?: string;
  shade?: 'deep' | 'soft';
}

export default function DynamicMagicBackground({ src, className = '', shade = 'deep' }: DynamicMagicBackgroundProps) {
  const isDeep = shade === 'deep';
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 42, damping: 24, mass: 0.8 });
  const smoothY = useSpring(pointerY, { stiffness: 42, damping: 24, mass: 0.8 });
  const farX = useTransform(smoothX, [-1, 1], ['-10px', '10px']);
  const farY = useTransform(smoothY, [-1, 1], ['-7px', '7px']);
  const nearX = useTransform(smoothX, [-1, 1], ['18px', '-18px']);
  const nearY = useTransform(smoothY, [-1, 1], ['12px', '-12px']);
  const fogX = useTransform(smoothX, [-1, 1], ['-24px', '24px']);
  const fogY = useTransform(smoothY, [-1, 1], ['-10px', '10px']);

  useEffect(() => {
    const updatePointer = (event: PointerEvent) => {
      const nextX = event.clientX / window.innerWidth - 0.5;
      const nextY = event.clientY / window.innerHeight - 0.5;
      pointerX.set(nextX * 2);
      pointerY.set(nextY * 2);
    };

    window.addEventListener('pointermove', updatePointer);
    return () => window.removeEventListener('pointermove', updatePointer);
  }, [pointerX, pointerY]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#100d0b] ${className}`} aria-hidden="true">
      <motion.img
        src={src}
        alt=""
        className="absolute inset-[-2%] h-[104%] w-[104%] object-cover"
        style={{ x: farX, y: farY }}
        initial={{ scale: 1.08 }}
        animate={{
          scale: [1.08, 1.14, 1.1],
        }}
        transition={{ duration: 24, ease: 'easeInOut', repeat: Infinity }}
      />

      <motion.img
        src={src}
        alt=""
        className="absolute inset-[-8%] h-[116%] w-[116%] object-cover opacity-[0.18] blur-[2px] mix-blend-screen [mask-image:linear-gradient(180deg,transparent_0%,black_54%,black_100%)]"
        style={{ x: nearX, y: nearY }}
        initial={{ scale: 1.12 }}
        animate={{ scale: [1.12, 1.17, 1.13] }}
        transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
      />

      <motion.div
        className="absolute inset-x-[-12%] bottom-[-8%] h-[46%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(238,218,176,0.24),transparent_62%)] blur-2xl"
        style={{ x: fogX, y: fogY }}
        animate={{ opacity: [0.32, 0.52, 0.36] }}
        transition={{ duration: 12, ease: 'easeInOut', repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-x-[-18%] top-[8%] h-[34%] bg-[linear-gradient(90deg,transparent,rgba(255,231,176,0.13),transparent)] blur-xl"
        animate={{ x: ['-18%', '18%', '-18%'], opacity: [0.1, 0.24, 0.1] }}
        transition={{ duration: 16, ease: 'easeInOut', repeat: Infinity }}
      />

      {motes.map((mote) => (
        <motion.span
          key={mote.id}
          className="absolute rounded-full bg-[#ffe1a3] shadow-[0_0_12px_rgba(255,225,163,0.75)]"
          style={{
            left: mote.left,
            top: mote.top,
            width: mote.size,
            height: mote.size,
          }}
          animate={{
            y: [0, -22, 0],
            x: [0, mote.id % 2 ? 12 : -12, 0],
            opacity: [0, 0.75, 0],
            scale: [0.7, 1.45, 0.7],
          }}
          transition={{ duration: 5.5 + (mote.id % 5), delay: mote.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div
        className={
          isDeep
            ? 'absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(197,160,89,0.11),transparent_38%),linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.64))]'
            : 'absolute inset-0 bg-[radial-gradient(circle_at_48%_28%,rgba(255,225,163,0.13),transparent_34%),linear-gradient(90deg,rgba(18,16,19,0.78),rgba(18,16,19,0.24)_50%,rgba(18,16,19,0.14))]'
        }
      />
    </div>
  );
}
