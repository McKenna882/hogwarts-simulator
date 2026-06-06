import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '../api/endpoints';
import { useUIStore } from '../stores/uiStore';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const showToast = useUIStore((s) => s.showToast);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('请输入邮箱地址');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      showToast('🦉 猫头鹰已出发送信', 'success');
    } catch (err: any) {
      setError(err.response?.data?.message || '发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-parchment-dark px-4 py-[calc(4rem+env(safe-area-inset-top))] sm:px-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="font-display text-2xl text-gold mb-2 sm:text-3xl">找回通行密语</h1>
          <p className="text-parchment/60 text-sm">猫头鹰会帮你送信</p>
        </div>

        <div className="card backdrop-blur-sm">
          {!sent ? (
            <>
              <div className="mb-4">
                <input
                  className="input-field"
                  type="email"
                  placeholder="输入你的魔法邮箱"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>

              {error && (
                <motion.p className="text-red-400 text-sm mb-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {error}
                </motion.p>
              )}

              <motion.button
                className="btn-primary w-full"
                onClick={handleSubmit}
                disabled={loading || !email}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? '🦉 猫头鹰正在飞行...' : '🦉 派出猫头鹰'}
              </motion.button>
            </>
          ) : (
            <motion.div
              className="text-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-5xl mb-4">🦉</div>
              <p className="text-gold mb-2">找回信已经交给猫头鹰</p>
              <p className="text-parchment/60 text-sm">请留意你的邮箱：{email}</p>
              <p className="text-parchment/30 text-xs mt-2">如果在收件箱中没有找到，请检查垃圾邮件</p>
            </motion.div>
          )}

          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="text-gold hover:text-gold-light transition-colors">
              ← 返回站台
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
