import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Banknote, Check, Copy, ScrollText, ShieldAlert, X } from 'lucide-react';
import { rechargeApi, walletApi } from '../api/endpoints';
import { useUserStore } from '../stores/userStore';
import { useUIStore } from '../stores/uiStore';
import DataState from '../components/DataState';

const VAULT_TERMS_KEY = 'hp_agreed_to_terms_v2';
const GBP_PER_GALLEON = 12.35;
const agreementParagraphs = [
  '古灵阁巫师银行（第一版）《金库及金融账户服务协议》。协议登记号：G/ACC/[ ]/WZ。签订地点：英国魔法界 · 对角巷 · 古灵阁总行。甲方为古灵阁巫师银行，乙方为签署魔法签名之巫师客户。双方在平等、自愿、充分阅读并理解本协议内容的基础上，就金库、流通账户、货币兑换、服务器维护贡献及相关安全事项达成本协议。',
  '鉴于甲方自公元1474年起为魔法世界提供金库托管、货币兑换及账户流通服务，其运营根植于妖精契约法则及魔法部特许经营权；鉴于乙方希望获得安全的地下金库使用权、流通账户服务及必要的金加隆管理功能，双方确认：本协议一经乙方主动勾选并确认，即视为乙方已经阅读全部条款，并愿意接受本协议约束。',
  '第一条，关于金库与巫师银行服务。古灵阁巫师银行为乙方提供金库余额展示、每日津贴领取、交易流水查询、麻瓜货币兑换入口、兑换凭证提交及未来可能开放的订阅或月卡服务。上述功能均属于巫师银行与金库体系的一部分，乙方进入本页面不代表已经发生充值、购买或订阅行为；任何涉及支付、兑换或订阅的操作，均应由乙方再次主动确认后方可进行。',
  '第二条，关于“氪金”与麻瓜货币兑换。充值并非必须。“麻瓜货币兑换通道”的开设，仅用于满足部分玩家快速获取资源或支持服务器运营的需求。乙方可以通过每日签到、特定互动、任务奖励、活动奖励等方式免费获取金加隆。不充值不应影响核心体验，包括聊天、恋爱、约会、剧情推进及基础社交互动。甲方不得以世界观包装掩盖付费性质，乙方也应在支付前清楚理解该行为涉及真实货币支出。',
  '第三条，关于月卡、订阅与服务器维护贡献。若未来开放订阅或月卡功能，该费用可被理解为服务器维护贡献，也可称为“猫头鹰口粮”。该费用主要用于维持霍格沃茨通讯系统、猫头鹰邮局、角色互动服务及相关云端资源的稳定运行。订阅并非强制要求，乙方可以根据自身需求决定是否参与；未订阅用户仍应保留合理的基础使用体验。',
  '第四条，理性消费承诺。魔法虽好，现实更重要。乙方在进行任何支付、兑换、订阅或购买前，应确认该开销不会影响现实生活、学习、工作、家庭责任及必要支出。乙方承诺量力而行，不因一时冲动、攀比心理、剧情沉浸或角色互动而进行超出自身承受能力的消费。甲方亦提醒乙方：按时领取每日津贴并不可耻，免费游玩同样是被允许且被尊重的选择。',
  '第五条，未成年人及限制行为能力人警示。虽然巫师世界中十七岁通常被视为成年，但若乙方在麻瓜法律意义上未满十八周岁，或不具备完全民事行为能力，应立即停止任何充值、订阅或购买行为。未成年人不得在未获得监护人明确同意或陪同的情况下进行任何消费。若乙方使用监护人账户、支付工具或设备完成消费，应自行确保已经获得合法授权。',
  '第六条，账户安全与兑换凭证。乙方应妥善保管自己的账号、密码、兑换凭证、卡密及其他身份认证信息。任何兑换凭证一经提交，可能与乙方账户绑定并产生不可逆的余额变动。乙方不得购买、传播、转售、伪造或使用来源不明的兑换凭证。若因乙方泄露凭证、共享账号、点击虚假链接或接受第三方代充造成损失，甲方将在法律允许范围内协助核查，但不承诺承担全部损失。',
  '第七条，交易记录与服务限制。金库页面展示的当前余额、签到奖励及流水记录以服务器记录为准。由于网络延迟、维护、缓存或第三方服务异常，余额显示可能存在短暂延迟。甲方有权对异常交易、疑似作弊、恶意刷取奖励、伪造兑换凭证、利用漏洞获取金加隆等行为进行冻结、回滚、限制访问或提交进一步处理。',
  '第八条，外部兑换入口提示。麻瓜货币兑换入口可能跳转至外部页面或第三方购买页面。乙方在离开霍格沃茨模拟器页面后，应自行确认目标站点、支付金额、订单信息、售后规则及隐私政策。甲方会尽力提供清晰入口说明，但乙方仍应在任何外部支付前进行独立判断。',
  '第九条，协议更新与重新确认。甲方可因功能调整、法律合规、未成年人保护、支付规则变化或服务器运营需要更新本协议。若协议版本更新，乙方可能需要重新阅读并确认。乙方继续使用巫师银行、金库、兑换、订阅或相关经济功能，视为接受更新后的协议。',
  '第十条，魔法签名与确认。乙方声明：我已阅读并理解本协议全部条款，尤其是充值非必需、理性消费、未成年人限制、外部支付风险及兑换凭证安全等内容。我确认进入古灵阁金库仅代表开启巫师银行功能，不代表自动充值、自动购买或自动订阅。若我选择后续进行任何支付或兑换，我将再次基于真实意愿作出明确决定。',
];

interface RechargePackage {
  id: string;
  name: string;
  amountCents: number;
  galleons: number;
  bonusGalleons: number;
}

interface ExchangeOrder {
  orderNo: string;
  virtualPayKey?: string;
  amountCents: number;
  galleons: number;
  bonusGalleons: number;
}

export default function VaultPage() {
  const balance = useUserStore((s) => s.profile?.wallet?.balanceGalleons ?? 0);
  const updateWalletBalance = useUserStore((s) => s.updateWalletBalance);
  const [signedIn, setSignedIn] = useState(false);
  const [signing, setSigning] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [exchangePackages, setExchangePackages] = useState<RechargePackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [exchangeOrder, setExchangeOrder] = useState<ExchangeOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAgreedTerms, setHasAgreedTerms] = useState(() =>
    typeof window === 'undefined' ? false : localStorage.getItem(VAULT_TERMS_KEY) === 'true',
  );
  const showToast = useUIStore((s) => s.showToast);

  useEffect(() => {
    if (hasAgreedTerms) loadData();
  }, [hasAgreedTerms]);

  const handleAgreeTerms = () => {
    localStorage.setItem(VAULT_TERMS_KEY, 'true');
    setHasAgreedTerms(true);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, signinRes, txRes] = await Promise.all([
        walletApi.getWallet(),
        walletApi.checkSignIn(),
        walletApi.getTransactions(),
      ]);
      updateWalletBalance(walletRes.data.balanceGalleons);
      setSignedIn(signinRes.data.signedIn);
      setTransactions(txRes.data.transactions || []);
    } catch {
      setError('加载金库数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasAgreedTerms) return;
    rechargeApi.getPackages()
      .then((res) => {
        const packages = res.data || [];
        setExchangePackages(packages);
        setSelectedPackageId((current) => current || packages[0]?.id || '');
      })
      .catch(() => showToast('加载兑换档位失败', 'error'));
  }, [hasAgreedTerms, showToast]);

  const handleCreateExchangeOrder = async () => {
    if (!selectedPackageId) return;
    setCreatingOrder(true);
    try {
      const res = await rechargeApi.createOrder(selectedPackageId);
      setExchangeOrder(res.data);
      showToast('兑换凭证已生成，请妥善保存', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || '生成兑换凭证失败', 'error');
    } finally {
      setCreatingOrder(false);
    }
  };

  const copyExchangeKey = async () => {
    if (!exchangeOrder?.virtualPayKey) return;
    await navigator.clipboard.writeText(exchangeOrder.virtualPayKey);
    showToast('兑换凭证已复制', 'success');
  };

  const handleSignIn = async () => {
    setSigning(true);
    try {
      const res = await walletApi.dailySignIn();
      showToast(`🎉 签到成功！获得 ${res.data.reward} 加隆`, 'success');
      setSignedIn(true);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || '签到失败', 'error');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="vault-8bit relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 pointer-events-none" />

      <div className="mb-6 relative">
        <h1 className="font-magical text-3xl text-hogwarts-gold tracking-widest mb-1">巫师银行</h1>
        <p className="text-hogwarts-paper/50 text-sm font-serif italic">Gringotts Wizarding Bank</p>
      </div>

      {!hasAgreedTerms && <VaultAgreementModal onAgree={handleAgreeTerms} />}

      {hasAgreedTerms && (
      <DataState loading={loading} error={error} onRetry={loadData}>

      <motion.div
        className="relative overflow-hidden rounded-lg border-4 border-hogwarts-goldDark/80 bg-[#f4e4d0] bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] text-center mb-6 shadow-[0_0_30px_rgba(197,160,89,0.2)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-2 right-2 bg-hogwarts-goldDark/20 rounded-full px-3 py-1">
          <span className="text-xs text-amber-900/60 font-serif italic">古灵阁认证</span>
        </div>
        <div className="px-4 py-7 sm:py-8">
          <div className="text-5xl mb-3">🏦</div>
          <p className="mb-1 break-words font-magical text-4xl tracking-widest text-hogwarts-goldDark sm:text-5xl">{balance}</p>
          <p className="text-amber-900/60 text-sm font-serif italic">Galleons</p>
          <p className="mt-3 text-sm text-amber-900/55 font-serif italic">当前金库余额</p>
          <div className="mt-3 inline-block border-t border-amber-900/20 pt-2">
            <p className="text-xs text-amber-900/50 font-serif italic">龙窟编号 · 713号金库</p>
          </div>
        </div>
        <p className="mx-auto mb-4 -mt-2 w-fit max-w-[calc(100%-2rem)] rounded border border-amber-900/18 bg-amber-100/45 px-3 py-1.5 text-center text-[12px] font-semibold text-amber-950/70 shadow-inner font-serif">
          巫师货币汇率：1 金加隆 = 17 银西可 = 493 铜纳特；1 银西可 = 29 铜纳特
        </p>
      </motion.div>

      <motion.div
        className="relative rounded-lg border border-hogwarts-goldDark/30 bg-hogwarts-bg/80 backdrop-blur-sm mb-6 p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-magical text-lg text-hogwarts-gold tracking-wider">每日签到</h3>
            <p className="text-hogwarts-paper/50 text-sm font-serif italic">
              {signedIn ? '今天已签到，明天再来吧' : '领取今天的津贴'}
            </p>
          </div>
          <button
            className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
              signedIn
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-hogwarts-gold text-black hover:bg-gold-light shadow-md hover:shadow-lg'
            }`}
            onClick={handleSignIn}
            disabled={signedIn || signing}
          >
            {signing ? '🦉...' : signedIn ? '✅ 已签到' : '✍️ 签到'}
          </button>
        </div>
      </motion.div>

      <motion.div
        className="relative rounded-lg border border-hogwarts-goldDark/30 bg-hogwarts-bg/80 backdrop-blur-sm p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4 border-b border-hogwarts-goldDark/20 pb-3">
          <span className="text-hogwarts-gold font-magical tracking-wider">流水记录</span>
          <span className="text-xs text-hogwarts-paper/30 font-serif italic">Transaction Log</span>
        </div>
        {transactions.length === 0 ? (
          <p className="text-hogwarts-paper/30 text-sm text-center py-4 font-serif italic">暂无流水记录</p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-center border-b border-hogwarts-goldDark/10 py-2.5 hover:bg-hogwarts-gold/5 px-2 rounded transition-colors">
                <div>
                  <p className="text-sm text-hogwarts-paper/80 font-serif">{tx.description || tx.source}</p>
                  <p className="text-xs text-hogwarts-paper/30 font-serif italic">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`font-magical tracking-wider ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}G
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        className="relative mt-6 rounded-lg border border-hogwarts-goldDark/35 bg-hogwarts-bg/80 p-5 backdrop-blur-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="mb-4 border-b border-hogwarts-goldDark/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-hogwarts-gold" aria-hidden="true" />
              <h3 className="font-magical text-lg tracking-wider text-hogwarts-gold">麻瓜货币兑换</h3>
            </div>
            <p className="mt-1 text-xs text-hogwarts-paper/45 font-serif italic">
              参考兑换：1 金加隆约等于 12.35 英镑
            </p>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid gap-3 sm:grid-cols-2">
            {exchangePackages.length === 0 ? (
              <p className="rounded-lg border border-hogwarts-goldDark/20 bg-black/20 px-4 py-5 text-sm text-hogwarts-paper/40">
                暂无可用兑换档位
              </p>
            ) : (
              exchangePackages.map((pkg) => {
                const totalGalleons = pkg.galleons + pkg.bonusGalleons;
                const pounds = (pkg.amountCents / 100).toFixed(2);
                const selected = selectedPackageId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                      selected
                        ? 'border-hogwarts-gold bg-hogwarts-gold/10'
                        : 'border-hogwarts-goldDark/20 bg-black/20 hover:bg-white/5'
                    }`}
                  >
                    <span className="block font-magical text-lg text-hogwarts-gold">{pkg.name}</span>
                    <span className="mt-1 block text-sm text-hogwarts-paper/72">
                      £{pounds} 兑换 {totalGalleons} G
                    </span>
                    <span className="mt-1 block text-xs text-hogwarts-paper/38">
                      {pkg.bonusGalleons > 0 ? `含 ${pkg.bonusGalleons} G 维护赠额` : `按 £${GBP_PER_GALLEON.toFixed(2)} / G 生成`}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-between rounded-lg border border-hogwarts-goldDark/25 bg-black/24 p-4 xl:min-w-52">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-hogwarts-paper/35">兑换凭证生成器</p>
              <p className="mt-2 text-sm leading-6 text-hogwarts-paper/62">
                生成兑换单只会创建待处理凭证，不会自动扣款或入账。
              </p>
            </div>
            <button
              type="button"
              disabled={!selectedPackageId || creatingOrder}
              onClick={handleCreateExchangeOrder}
              className="mt-4 rounded-lg bg-hogwarts-gold px-4 py-2.5 font-bold text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
            >
              {creatingOrder ? '生成中...' : '生成兑换凭证'}
            </button>
          </div>
        </div>

        {exchangeOrder && (
          <div className="mt-4 rounded-lg border border-hogwarts-gold/30 bg-black/30 p-4">
            <div className="grid gap-3 text-sm text-hogwarts-paper/72 sm:grid-cols-3">
              <div>
                <p className="text-xs text-hogwarts-paper/35">兑换单号</p>
                <p className="mt-1 break-all font-mono text-hogwarts-gold">{exchangeOrder.orderNo}</p>
              </div>
              <div>
                <p className="text-xs text-hogwarts-paper/35">兑换内容</p>
                <p className="mt-1">{exchangeOrder.galleons + exchangeOrder.bonusGalleons} G</p>
              </div>
              <div>
                <p className="text-xs text-hogwarts-paper/35">参考金额</p>
                <p className="mt-1">£{(exchangeOrder.amountCents / 100).toFixed(2)}</p>
              </div>
            </div>
            {exchangeOrder.virtualPayKey && (
              <button
                type="button"
                onClick={copyExchangeKey}
                className="mt-3 inline-flex items-center gap-2 rounded border border-hogwarts-gold/35 px-3 py-2 text-xs text-hogwarts-gold transition-colors hover:bg-hogwarts-gold/10"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                复制兑换凭证
              </button>
            )}
          </div>
        )}
      </motion.div>
      </DataState>
      )}
    </div>
  );
}

function VaultAgreementModal({ onAgree }: { onAgree: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/78 px-4 py-6 backdrop-blur-sm">
      <motion.div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-hogwarts-gold/55 bg-[#16110d] shadow-[0_24px_90px_rgba(0,0,0,0.62)]"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="border-b border-hogwarts-gold/25 bg-black/24 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hogwarts-gold/45 bg-hogwarts-gold/10">
                <ScrollText className="h-5 w-5 text-hogwarts-gold" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-magical text-2xl text-hogwarts-gold sm:text-3xl">古灵阁金库开户协议</h2>
                <p className="text-sm italic text-hogwarts-paper/45">Gringotts Service Agreement</p>
              </div>
            </div>
            <ShieldAlert className="mt-2 h-5 w-5 shrink-0 text-hogwarts-gold/70" aria-hidden="true" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <article className="rounded-lg border border-hogwarts-gold/20 bg-[#231912]/72 px-5 py-5 text-[15px] leading-8 text-hogwarts-paper/82 shadow-inner sm:px-7 sm:py-6">
            <p className="mb-5 text-center font-magical text-xl text-hogwarts-gold">《金库及金融账户服务协议》</p>
            <div className="space-y-5 text-justify">
              {agreementParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        </div>

        <div className="border-t border-hogwarts-gold/25 bg-black/28 px-5 py-4 sm:px-6">
          <label className="mb-4 flex cursor-pointer items-center gap-3 text-sm text-hogwarts-paper/80">
            <input
              type="checkbox"
              className="h-4 w-4 accent-hogwarts-gold"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
            />
            我已阅读并确认。
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-hogwarts-gold/35 px-4 py-2.5 text-hogwarts-paper/70 transition-colors hover:bg-white/5"
              onClick={() => window.history.back()}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              暂不进入
            </button>
            <button
              type="button"
              disabled={!checked}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-hogwarts-gold px-5 py-2.5 font-bold text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
              onClick={onAgree}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {checked ? '进入古灵阁金库' : '请先勾选同意条款'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
