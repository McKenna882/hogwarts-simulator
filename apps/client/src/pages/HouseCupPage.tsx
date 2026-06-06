import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { houseCupApi } from '../api/endpoints';
import { useUserStore } from '../stores/userStore';
import { useUIStore } from '../stores/uiStore';

// ── 四大学院配置 ──
const HOUSES = ['格兰芬多', '斯莱特林', '拉文克劳', '赫奇帕奇'];

const HOUSE_STYLES: Record<string, { primary: string; sandLight: string; sandShadow: string; label: string }> = {
  '格兰芬多': { primary: '#b91c1c', sandLight: '#f87171', sandShadow: '#7f1d1d', label: '格兰芬多' },
  '斯莱特林': { primary: '#15803d', sandLight: '#4ade80', sandShadow: '#14532d', label: '斯莱特林' },
  '拉文克劳': { primary: '#1d4ed8', sandLight: '#60a5fa', sandShadow: '#1e3a8a', label: '拉文克劳' },
  '赫奇帕奇': { primary: '#ca8a04', sandLight: '#fbbf24', sandShadow: '#713f12', label: '赫奇帕奇' },
};

const HOUSE_EMOJIS: Record<string, string> = {
  '格兰芬多': '🦁',
  '斯莱特林': '🐍',
  '拉文克劳': '🦅',
  '赫奇帕奇': '🦡',
};

// ── 答题等级评分映射 ──
function getGrade(correct: number, total: number) {
  if (correct >= 9) return { grade: 'O', name: '杰出', points: 20, color: 'text-yellow-400', emoji: '🏆' };
  if (correct >= 7) return { grade: 'E', name: '良好', points: 10, color: 'text-green-400', emoji: '✅' };
  if (correct >= 6) return { grade: 'A', name: '及格', points: 5, color: 'text-blue-400', emoji: '👍' };
  if (correct >= 4) return { grade: 'P', name: '差', points: -5, color: 'text-orange-400', emoji: '😓' };
  if (correct >= 2) return { grade: 'D', name: '很差', points: -10, color: 'text-red-400', emoji: '😹' };
  return { grade: 'T', name: '巨怪', points: -20, color: 'text-red-600', emoji: '👹' };
}

// 难度标签
const DIFFICULTY_LABELS: Record<string, { stars: string; bg: string }> = {
  easy: { stars: '★', bg: 'from-green-600/20 to-green-700/20 border-green-500/30' },
  medium: { stars: '★★', bg: 'from-yellow-600/20 to-orange-700/20 border-yellow-500/30' },
  hard: { stars: '★★★', bg: 'from-red-600/20 to-red-700/20 border-red-500/30' },
};

type Tab = 'standings' | 'bulletin' | 'quiz';

// ── 学院积分柱状图组件 ──
function HouseBar({ house, points, maxPoints, isUserHouse }: {
  house: string;
  points: number;
  maxPoints: number;
  isUserHouse: boolean;
}) {
  const style = HOUSE_STYLES[house] || HOUSE_STYLES['格兰芬多'];
  const pct = maxPoints > 0 ? (points / maxPoints) * 100 : 0;

  return (
    <div className={`flex flex-col items-center gap-1 ${isUserHouse ? 'scale-110' : 'scale-95 opacity-80'}`}>
      {/* 学院徽章 */}
      <div className="text-2xl mb-1">{HOUSE_EMOJIS[house] || '🏰'}</div>

      {/* 沙漏柱状图 */}
      <div className="flex flex-col items-center">
        {/* 顶部装饰 */}
        <div
          className="w-10 h-2 rounded-t-sm border border-white/20"
          style={{ backgroundColor: style.primary + '40' }}
        />
        {/* 柱子 */}
        <div
          className="w-10 h-28 relative overflow-hidden border-2 border-t-0 border-white/20 rounded-b-sm bg-black/20"
        >
          <motion.div
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
            style={{ height: `${pct}%`, backgroundColor: style.primary }}
            initial={{ height: 0 }}
            animate={{ height: `${pct}%` }}
          >
            <div className="absolute top-0 w-full h-0.5 bg-white/30" />
          </motion.div>
        </div>

        {/* 底部装饰 */}
        <div
          className="w-10 h-1 mt-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${style.sandShadow}, ${style.sandLight}, ${style.sandShadow})` }}
        />
      </div>

      {/* 积分数字 */}
      <div className="text-center mt-1">
        <div
          className="text-sm font-bold font-serif"
          style={{ color: style.sandLight, textShadow: `0 0 8px ${style.primary}` }}
        >
          {points.toLocaleString()}
        </div>
        <div className="text-xs text-gray-400">{house}</div>
      </div>
    </div>
  );
}

// ── 主页面 ──
export default function HouseCupPage() {
  const [standings, setStandings] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>('standings');
  const [msg, setMsg] = useState('');
  const showToast = useUIStore((s) => s.showToast);
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);

  // 布告栏状态
  const [bulletin, setBulletin] = useState<{ tasks: any[]; quizCompleted: boolean; completedDifficulties: string[] } | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  // 答题状态
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizPhase, setQuizPhase] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [qIndex, setQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [timer, setTimer] = useState(15);
  const [submitting, setSubmitting] = useState(false);

  // 分院锁定
  const [houseDialog, setHouseDialog] = useState(false);
  const userHouse = profile?.profile?.house || null;
  const houseLocked = profile?.profile?.houseLocked || false;

  const loadStandings = useCallback(async () => {
    try {
      const res = await houseCupApi.getStandings();
      setStandings(res.data);
    } catch {}
  }, []);

  const loadBulletin = useCallback(async () => {
    try {
      const res = await houseCupApi.getBulletin();
      setBulletin(res.data);
    } catch {}
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      const res = await houseCupApi.getQuizQuestions();
      setQuestions(res.data);
    } catch {
      showToast('加载题目失败', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadStandings();
  }, [loadStandings]);

  // ── 布告栏领取 ──
  const handleClaim = async (difficulty: string) => {
    setClaiming(difficulty);
    try {
      const res = await houseCupApi.claimBulletin(difficulty);
      if (res.data.claimed) {
        setMsg(`🎉 获得 ${res.data.housePoints} 学院积分 + ${res.data.galleons}G！`);
        loadStandings();
        loadBulletin();
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message || '领取失败', 'error');
    } finally {
      setClaiming(null);
    }
  };

  // ── 答题计时器 ──
  useEffect(() => {
    if (quizPhase !== 'playing') return;
    if (timer <= 0) {
      handleAnswer(null);
      return;
    }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [quizPhase, timer]);

  const startQuiz = async () => {
    await loadQuestions();
    setQuizPhase('playing');
    setQIndex(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setRevealed(false);
    setTimer(15);
  };

  const handleAnswer = (answer: string | null) => {
    if (revealed) return;
    setSelectedAnswer(answer);
    setRevealed(true);

    const current = questions[qIndex];
    if (answer && answer === current.answer) {
      setCorrectCount((c) => c + 1);
    }

    setTimeout(() => {
      if (qIndex >= questions.length - 1) {
        setQuizPhase('finished');
      } else {
        setQIndex((i) => i + 1);
        setSelectedAnswer(null);
        setRevealed(false);
        setTimer(15);
      }
    }, 1200);
  };

  const submitQuizResult = async () => {
    if (!userHouse) {
      showToast('请先选择学院！', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await houseCupApi.submitQuizResult(userHouse, correctCount);
      const r = res.data;
      showToast(`${r.grade} (${r.name}) ${r.points > 0 ? '+' : ''}${r.points} 学院分`, r.points >= 0 ? 'success' : 'error');
      loadStandings();
      setQuizPhase('ready');
    } catch (e: any) {
      showToast(e?.response?.data?.message || '提交失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 分院锁定 ──
  const handleLockHouse = async () => {
    try {
      await houseCupApi.lockHouse();
      setProfile({ profile: { ...profile?.profile, houseLocked: true } });
      setHouseDialog(false);
      showToast('🔒 学院已锁定！', 'success');
    } catch (e: any) {
      showToast(e?.response?.data?.message || '锁定失败', 'error');
    }
  };

  const maxPoints = Math.max(...standings.map((h) => h.points), 1);
  const currentQ = questions[qIndex];
  const grade = getGrade(correctCount, questions.length);

  // ── 渲染 ──
  return (
    <div className="space-y-4">
      {/* 标题 */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl text-gold mb-1">🏆 学院杯</h1>
        <p className="text-parchment/40 text-xs">四大学院的荣誉竞赛</p>
      </motion.div>

      {/* 提示消息 */}
      {msg && (
        <motion.div
          className="card py-2 text-sm text-center text-gold"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {msg}
        </motion.div>
      )}

      {/* 未分院的提示 */}
      {!userHouse && (
        <div className="card border-amber-500/40 bg-amber-900/20 text-amber-300 text-sm text-center py-3">
          ⚠️ 你还没有选择学院！请先去个人档案中选择学院，才能参与学院杯。
        </div>
      )}

      {/* 学院锁定提示 */}
      {userHouse && !houseLocked && (
        <div className="card border-yellow-500/40 bg-yellow-900/20">
          <p className="text-xs text-yellow-300 mb-2">
            ⚠️ 你的学院尚未锁定。锁定后将无法更改，学院杯积分将归属此学院。
          </p>
          <button
            className="py-1 px-3 text-xs font-bold text-white bg-amber-700 hover:bg-amber-600 rounded transition-colors"
            onClick={() => setHouseDialog(true)}
          >
            🔒 确认并锁定学院
          </button>
        </div>
      )}

      {/* ── 学院积分排名 ── */}
      {standings.length > 0 && (
        <div className="card">
          <h2 className="text-center text-sm text-gray-400 mb-4 tracking-wider">🏠 学院积分</h2>
          <div className="flex justify-around items-end">
            {standings.map((h) => (
              <HouseBar
                key={h.id}
                house={h.name}
                points={h.points}
                maxPoints={maxPoints}
                isUserHouse={h.name === userHouse}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 学院锁定确认弹窗 ── */}
      <AnimatePresence>
        {houseDialog && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="bg-hogwarts-dark rounded-xl max-w-sm w-full border border-hogwarts-goldDark/30 p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-gold mb-3">🔒 确认锁定学院</h3>
              <p className="text-sm text-gray-300 mb-2">
                确定锁定为 <span className="text-gold font-bold">{userHouse}</span> 吗？
              </p>
              <p className="text-xs text-gray-400 mb-4">
                锁定后将无法更改学院，你为学院杯做出的所有贡献都将归属此学院。
              </p>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm"
                  onClick={() => setHouseDialog(false)}
                >
                  取消
                </button>
                <button
                  className="flex-1 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-600 text-sm font-bold"
                  onClick={handleLockHouse}
                >
                  确认锁定
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 标签页切换 ── */}
      <div className="flex gap-2 border-b border-gold/20 pb-2">
        {[
          { key: 'standards' as Tab, label: '🏆 排名' },
          { key: 'bulletin' as Tab, label: '📋 布告栏' },
          { key: 'quiz' as Tab, label: '📝 答题' },
        ].map((t) => (
          <button
            key={t.key}
            className={`px-4 py-1.5 rounded-t-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-gold/20 text-gold border-b-2 border-gold' : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════ 布告栏 ═══════════ */}
      {tab === 'bulletin' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-gold font-display">📋 布告栏 · 每日任务</h3>
            <button className="text-xs text-gray-400 hover:text-gold" onClick={loadBulletin}>
              🔄 刷新
            </button>
          </div>

          {!bulletin ? (
            <div className="text-center text-gray-500 py-8">加载中...</div>
          ) : (
            bulletin.tasks.map((task: any) => {
              const diff = DIFFICULTY_LABELS[task.difficulty] || DIFFICULTY_LABELS.easy;
              const isCompleted = bulletin.completedDifficulties.includes(task.difficulty);
              const isClaiming = claiming === task.difficulty;
              return (
                <div
                  key={task.id}
                  className={`rounded-xl p-4 border bg-gradient-to-br ${diff.bg} ${
                    isCompleted ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{diff.stars}</span>
                    {isCompleted && <span className="text-xs text-green-400 font-bold">✅ 已完成</span>}
                  </div>
                  <h4 className="text-base font-bold text-gray-100 mb-1">{task.title}</h4>
                  <p className="text-sm text-gray-300 mb-3">{task.description}</p>
                  <div className="flex items-center gap-4 mb-3 text-xs">
                    <span className="text-hogwarts-gold">🏆 {task.housePoints} 学院分</span>
                    <span className="text-yellow-400">{task.galleons} G</span>
                  </div>
                  {!isCompleted && (
                    <button
                      className="w-full py-2 rounded-lg text-sm font-bold bg-hogwarts-gold/80 hover:bg-hogwarts-gold text-black transition-all disabled:opacity-50"
                      disabled={isClaiming}
                      onClick={() => handleClaim(task.difficulty)}
                    >
                      {isClaiming ? '领取中...' : '领取奖励'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════ 每日答题 ═══════════ */}
      {tab === 'quiz' && (
        <div className="space-y-4">
          {/* 准备阶段 */}
          {quizPhase === 'ready' && (
            <div className="card text-center py-8 space-y-6">
              <div className="text-6xl">📘</div>
              <div>
                <h3 className="text-xl font-bold text-gray-100 mb-2">每日学院杯答题</h3>
                <p className="text-gray-400 text-sm">共 10 题，每题 15 秒</p>
              </div>

              <div className="bg-black/30 rounded-lg p-4 text-left text-sm space-y-2 max-w-sm mx-auto">
                <p className="text-gray-300"><span className="text-yellow-400">O</span> 杰出 (9-10 题): <span className="text-green-400">+20 分</span></p>
                <p className="text-gray-300"><span className="text-green-400">E</span> 良好 (7-8 题): <span className="text-green-400">+10 分</span></p>
                <p className="text-gray-300"><span className="text-blue-400">A</span> 及格 (6 题): <span className="text-blue-400">+5 分</span></p>
                <p className="text-gray-300"><span className="text-orange-400">P</span> 差 (4-5 题): <span className="text-orange-400">-5 分</span></p>
                <p className="text-gray-300"><span className="text-red-400">D</span> 很差 (2-3 题): <span className="text-red-400">-10 分</span></p>
                <p className="text-gray-300"><span className="text-red-600">T</span> 巨怪 (0-1 题): <span className="text-red-600">-20 分</span></p>
              </div>

              <button
                className="px-8 py-3 bg-hogwarts-gold text-hogwarts-dark font-bold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
                onClick={startQuiz}
                disabled={!userHouse || !questions.length}
              >
                开始答题
              </button>
            </div>
          )}

          {/* 答题中 */}
          {quizPhase === 'playing' && currentQ && (
            <div className="card space-y-4">
              {/* 进度与计时 */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  第 <span className="text-gold font-bold">{qIndex + 1}</span> / {questions.length} 题
                </span>
                <span className={`font-bold ${timer <= 5 ? 'text-red-400' : 'text-gray-400'}`}>
                  ⏱ {timer}s
                </span>
              </div>

              {/* 进度条 */}
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full transition-all duration-1000 ${timer <= 5 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${(timer / 15) * 100}%` }}
                />
              </div>

              {/* 题目 */}
              <h3 className="text-lg font-bold text-gray-100">{currentQ.question}</h3>

              {/* 选项 */}
              <div className="space-y-3">
                {currentQ.options.map((opt: string) => {
                  const label = opt.charAt(0);
                  const isSelected = selectedAnswer === label;
                  const isCorrect = revealed && label === currentQ.answer;
                  const isWrong = revealed && isSelected && !isCorrect;
                  return (
                    <button
                      key={label}
                      className={`w-full p-3 rounded-lg text-left transition-all border ${
                        isCorrect
                          ? 'border-green-500 bg-green-500/20 text-green-300'
                          : isWrong
                          ? 'border-red-500 bg-red-500/20 text-red-300'
                          : isSelected
                          ? 'border-hogwarts-gold bg-hogwarts-gold/20 text-gold'
                          : 'border-gray-700 bg-hogwarts-dark hover:border-gray-500 text-gray-200'
                      }`}
                      onClick={() => handleAnswer(label)}
                      disabled={revealed}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 完成阶段 */}
          {quizPhase === 'finished' && (
            <div className="card text-center py-8 space-y-6">
              <div className="text-6xl">{grade.emoji}</div>
              <div>
                <div className={`text-4xl font-bold mb-2 ${grade.color}`}>{grade.grade}</div>
                <p className="text-gray-100 text-lg">{grade.name}</p>
                <p className="text-gray-400 mt-2">答对 {correctCount} / {questions.length} 题</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4 max-w-xs mx-auto">
                <p className="text-gray-300 text-sm">这次会为学院杯带来</p>
                <p className={`text-2xl font-bold mt-1 ${grade.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {grade.points > 0 ? '+' : ''}{grade.points} 分
                </p>
              </div>
              <button
                className="px-8 py-3 bg-hogwarts-gold text-hogwarts-dark font-bold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
                onClick={submitQuizResult}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '提交成绩'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 学院杯说明 */}
      <div className="card bg-black/20 border-dashed border-gold/20">
        <h4 className="text-xs text-gold/60 mb-2">💡 学院杯说明</h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• <span className="text-gold/60">每日答题</span>：10道题，按答对数量评级（O~T），对应±20~-20学院积分</li>
          <li>• <span className="text-gold/60">布告栏任务</span>：每日三个难度任务，完成领取学院积分</li>
          <li>• <span className="text-gold/60">魁地奇比赛</span>：获胜 +50 学院积分</li>
          <li>• 分院后锁定学院，积分将归属该学院</li>
        </ul>
      </div>
    </div>
  );
}