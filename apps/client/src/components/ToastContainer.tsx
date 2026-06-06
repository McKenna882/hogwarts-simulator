import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore, ToastType } from '../stores/uiStore';

const typeStyles: Record<ToastType, string> = {
  success: 'border-green-500/50 bg-green-900/30 text-green-300',
  error: 'border-red-500/50 bg-red-900/30 text-red-300',
  info: 'border-gold/50 bg-black/60 text-parchment',
  loading: 'border-blue-500/50 bg-blue-900/30 text-blue-300',
};

const typeIcons: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: '🦉',
  loading: '⏳',
};

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg border text-sm shadow-xl backdrop-blur-md cursor-pointer ${typeStyles[toast.type]}`}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => dismissToast(toast.id)}
          >
            <div className="flex items-center gap-2">
              <span>{typeIcons[toast.type]}</span>
              <span className="flex-1">{toast.message}</span>
              <button
                className="text-parchment/40 hover:text-parchment/80 text-xs ml-2"
                onClick={(e) => { e.stopPropagation(); dismissToast(toast.id); }}
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
