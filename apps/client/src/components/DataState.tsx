import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface DataStateProps {
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMsg?: string;
  emptyIcon?: string;
  loadingMsg?: string;
  onRetry?: () => void;
  children: ReactNode;
}

export default function DataState({
  loading,
  error,
  isEmpty,
  emptyMsg = '暂无数据',
  emptyIcon = '🦉',
  loadingMsg = '加载中...',
  onRetry,
  children,
}: DataStateProps) {
  // 加载中
  if (loading) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-12 text-parchment/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex gap-1 mb-3">
          <span className="w-2.5 h-2.5 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2.5 h-2.5 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2.5 h-2.5 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-sm">{loadingMsg}</p>
      </motion.div>
    );
  }

  // 错误
  if (error) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-4xl mb-3">🌩️</div>
        <p className="text-red-400 text-sm mb-3">{error}</p>
        {onRetry && (
          <button className="btn-ghost text-xs py-1.5" onClick={onRetry}>
            重试
          </button>
        )}
      </motion.div>
    );
  }

  // 空数据
  if (isEmpty) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-5xl mb-3">{emptyIcon}</div>
        <p className="text-parchment/30 text-sm">{emptyMsg}</p>
      </motion.div>
    );
  }

  // 正常渲染
  return <>{children}</>;
}
