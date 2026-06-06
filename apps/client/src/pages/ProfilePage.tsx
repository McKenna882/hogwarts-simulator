import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Check, ScrollText, Wand2, X } from 'lucide-react';
import { usersApi } from '../api/endpoints';
import DataState from '../components/DataState';
import { useUIStore } from '../stores/uiStore';
import { useUserStore } from '../stores/userStore';

const HOUSES = ['格兰芬多', '斯莱特林', '拉文克劳', '赫奇帕奇'];
const GRADES = ['1 年级', '2 年级', '3 年级', '4 年级', '5 年级', '6 年级', '7 年级'];
const GENDERS = ['女巫', '男巫', '其他'];
const BLOOD_TYPES = ['纯血', '混血', '麻瓜出身', '哑炮', '混血种族'];
const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
const DAYS = Array.from({ length: 31 }, (_, i) => `${i + 1}日`);
const SUBJECTS = ['变形术', '魔咒学', '魔药学', '黑魔法防御术', '魔法史', '草药学', '天文学', '飞行课'];
const ELECTIVES = ['保护神奇动物学', '占卜学', '算术占卜', '古代如尼文', '麻瓜研究'];
const PETS = ['猫头鹰', '猫', '蟾蜍', '侏儒蒲', '无'];
const FAMILY_TYPES = ['普通巫师家庭', '神圣二十八族旁支', '神圣二十八族嫡系', '古老纯血家族继承人', '麻瓜家庭', '混血家庭', '孤儿或寄养'];
const COMMUNITY_TYPES = ['麻瓜社区', '巫师村落', '混居街区', '对角巷附近', '霍格莫德附近', '乡间庄园'];
const WAND_TYPES = [
  '冬青木 · 凤凰羽毛杖芯',
  '葡萄藤木 · 龙心弦杖芯',
  '柳木 · 独角兽毛杖芯',
  '山楂木 · 独角兽毛杖芯',
  '紫杉木 · 凤凰羽毛杖芯',
  '樱桃木 · 龙心弦杖芯',
  '黑檀木 · 龙心弦杖芯',
  '柏木 · 独角兽毛杖芯',
  '榆木 · 龙心弦杖芯',
  '胡桃木 · 凤凰羽毛杖芯',
  '接骨木 · 夜骐尾羽杖芯',
  '自定义魔杖',
];
const PATRONUS_TYPES = [
  '牡鹿',
  '牝鹿',
  '水獭',
  '杰克罗素梗',
  '凤凰',
  '银色天鹅',
  '猫',
  '狼',
  '狐狸',
  '鹰',
  '渡鸦',
  '独角兽',
  '夜骐',
  '龙',
  '豹',
  '雪貂',
  '野兔',
  '海豚',
  '还未显形',
  '自定义守护神',
];

const PROFILE_MARKER = '---HOGWARTS_ENROLLMENT_V1---';

type ExtendedProfile = {
  lastName: string;
  firstName: string;
  englishName: string;
  gender: string;
  blood: string;
  hair: string;
  eyes: string;
  height: string;
  weight: string;
  birthMonth: string;
  birthDay: string;
  familyType: string;
  community: string;
  upbringing: string;
  address: string;
  background: string;
  environment: string;
  strengths: string[];
  weaknesses: string[];
  electives: string[];
  wand: string;
  pet: string;
  patronus: string;
  quidditchMember: string;
};

const defaultExtended: ExtendedProfile = {
  lastName: '',
  firstName: '',
  englishName: '',
  gender: '女巫',
  blood: '混血',
  hair: '',
  eyes: '',
  height: '',
  weight: '',
  birthMonth: '',
  birthDay: '',
  familyType: '',
  community: '',
  upbringing: '',
  address: '',
  background: '',
  environment: '',
  strengths: [],
  weaknesses: [],
  electives: [],
  wand: '',
  pet: '猫头鹰',
  patronus: '',
  quidditchMember: '否',
};

function parseBio(raw?: string | null) {
  if (!raw) return { publicBio: '', extended: defaultExtended };
  if (!raw.includes(PROFILE_MARKER)) return { publicBio: raw, extended: defaultExtended };

  const [publicBio, payload] = raw.split(PROFILE_MARKER);
  try {
    return {
      publicBio: publicBio.trim(),
      extended: { ...defaultExtended, ...JSON.parse(payload.trim()) },
    };
  } catch {
    return { publicBio: publicBio.trim(), extended: defaultExtended };
  }
}

function serializeBio(publicBio: string, extended: ExtendedProfile) {
  return `${publicBio.trim()}\n\n${PROFILE_MARKER}\n${JSON.stringify(extended)}`;
}

export default function ProfilePage() {
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const showToast = useUIStore((s) => s.showToast);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [wizardTitle, setWizardTitle] = useState('');
  const [house, setHouse] = useState('');
  const [grade, setGrade] = useState('');
  const [team, setTeam] = useState('');
  const [publicBio, setPublicBio] = useState('');
  const [extended, setExtended] = useState<ExtendedProfile>(defaultExtended);

  useEffect(() => {
    loadProfile();
  }, []);

  const initials = useMemo(() => {
    const source = displayName || nickname || profile?.email || '无';
    return source.slice(0, 1).toUpperCase();
  }, [displayName, nickname, profile?.email]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getProfile();
      const data = res.data;
      const parsed = parseBio(data.profile?.bio);
      setProfile(data);
      setDisplayName(data.displayName || '');
      setNickname(data.profile?.nickname || '');
      setWizardTitle(data.profile?.wizardTitle || '');
      setHouse(data.profile?.house || '');
      setGrade(data.profile?.grade || '');
      setTeam(data.profile?.team || '');
      setPublicBio(parsed.publicBio);
      setExtended(parsed.extended);
    } catch {
      setError('加载档案失败');
    } finally {
      setLoading(false);
    }
  };

  const updateExtended = <K extends keyof ExtendedProfile>(key: K, value: ExtendedProfile[K]) => {
    setExtended((current) => ({ ...current, [key]: value }));
  };

  const toggleArrayField = (key: 'strengths' | 'weaknesses' | 'electives', value: string) => {
    setExtended((current) => {
      const values = new Set(current[key]);
      if (values.has(value)) values.delete(value);
      else values.add(value);
      return { ...current, [key]: Array.from(values) };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await usersApi.updateProfile({
        displayName: displayName || undefined,
        nickname: nickname || undefined,
        wizardTitle: wizardTitle || undefined,
        house: house || undefined,
        grade: grade || undefined,
        team: team || undefined,
        bio: serializeBio(publicBio, extended),
      });
      setProfile(res.data);
      showToast('入学登记表已更新', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || '保存档案失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DataState loading={loading} error={error} onRetry={loadProfile}>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0 lg:backdrop-blur-0">
        <motion.section
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border-4 border-hogwarts-goldDark bg-[#f6ead2] bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] text-[#1f160c] shadow-[0_0_45px_rgba(197,160,89,0.3)]"
        >
          <header className="relative shrink-0 border-b-2 border-hogwarts-gold bg-hogwarts-goldDark px-5 py-4 text-center text-hogwarts-paper">
            <button
              type="button"
              title="返回"
              aria-label="返回"
              onClick={() => history.back()}
              className="absolute right-4 top-4 rounded-md p-1.5 text-hogwarts-paper/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="flex items-center justify-center gap-2">
              <ScrollText className="h-5 w-5" aria-hidden="true" />
              <h1 className="font-magical text-2xl tracking-widest">霍格沃茨入学登记表</h1>
            </div>
            <p className="mt-1 font-serif text-sm italic text-hogwarts-paper/75">Student Enrollment Record</p>
          </header>

          <form className="flex-1 overflow-y-auto p-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="mb-7 flex flex-col items-center gap-3">
              <button
                type="button"
                className="group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-hogwarts-goldDark bg-hogwarts-goldDark/20 text-4xl font-magical text-hogwarts-goldDark"
              >
                {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
                <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="mr-1 h-4 w-4" aria-hidden="true" />
                  更换照片
                </span>
              </button>
              <p className="font-magical text-lg text-hogwarts-goldDark">{displayName || '无名巫师'}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-5">
                <PaperPanel title="基本信息">
                  <div className="grid gap-3">
                    <TextField label="姓氏 (Last Name)" value={extended.lastName} onChange={(v) => updateExtended('lastName', v)} />
                    <TextField label="名字 (First Name)" value={extended.firstName} onChange={(v) => updateExtended('firstName', v)} />
                    <TextField label="英文全名 (English Full Name)" value={extended.englishName} onChange={(v) => updateExtended('englishName', v)} />
                    <TextField label="显示名称" value={displayName} onChange={setDisplayName} />
                    <TextField label="昵称" value={nickname} onChange={setNickname} />
                    <SelectField label="年级 (Year)" value={grade} onChange={setGrade} options={GRADES} placeholder="选择年级" />
                    <SelectField label="性别" value={extended.gender} onChange={(v) => updateExtended('gender', v)} options={GENDERS} />
                    <SelectField label="血统" value={extended.blood} onChange={(v) => updateExtended('blood', v)} options={BLOOD_TYPES} />
                  </div>
                  <p className="mt-3 rounded-md border border-hogwarts-goldDark/30 bg-[#ead8b9] p-3 text-xs leading-5 text-[#3a2815]">
                    注：部分神圣二十八族角色会根据你的姓氏和血统改变态度。
                  </p>
                </PaperPanel>

                <PaperPanel title="所属学院">
                  <div className="grid grid-cols-2 gap-2">
                    {HOUSES.map((item) => <ChoiceButton key={item} active={house === item} onClick={() => setHouse(item)}>{item}</ChoiceButton>)}
                  </div>
                  <button type="button" className="mt-3 w-full rounded-md border border-hogwarts-goldDark/30 bg-hogwarts-goldDark/10 px-3 py-2 text-left text-sm text-hogwarts-goldDark transition-colors hover:bg-hogwarts-goldDark/15">
                    分院帽还在沉思，稍后决定
                  </button>
                </PaperPanel>

                <PaperPanel title="个人设定">
                  <p className="mb-3 text-xs leading-5 text-[#3a2815]">以下信息角色不会主动提起，但在约会模式或相关话题中会知晓。</p>
                  <div className="grid gap-3">
                    <TextField label="头发颜色" value={extended.hair} onChange={(v) => updateExtended('hair', v)} />
                    <TextField label="眼睛颜色" value={extended.eyes} onChange={(v) => updateExtended('eyes', v)} />
                    <TextField label="身高" value={extended.height} onChange={(v) => updateExtended('height', v)} />
                    <TextField label="体重" value={extended.weight} onChange={(v) => updateExtended('weight', v)} />
                    <SelectField label="生日月份" value={extended.birthMonth} onChange={(v) => updateExtended('birthMonth', v)} options={MONTHS} placeholder="月份" />
                    <SelectField label="生日日期" value={extended.birthDay} onChange={(v) => updateExtended('birthDay', v)} options={DAYS} placeholder="日期" />
                  </div>
                </PaperPanel>

                <PaperPanel title="身世背景">
                  <div className="space-y-3">
                    <TextAreaField label="身世背景" value={extended.background} onChange={(v) => updateExtended('background', v)} maxLength={200} rows={3} />
                    <SelectField label="家庭身份" value={extended.familyType} onChange={(v) => updateExtended('familyType', v)} options={FAMILY_TYPES} placeholder="选择家庭身份" />
                    <SelectField label="家庭社区" value={extended.community} onChange={(v) => updateExtended('community', v)} options={COMMUNITY_TYPES} placeholder="选择社区类别" />
                    <TextField label="成长环境" value={extended.upbringing} onChange={(v) => updateExtended('upbringing', v)} maxLength={40} />
                    <TextField label="家庭地址" value={extended.address} onChange={(v) => updateExtended('address', v)} maxLength={30} />
                    <TextAreaField label="环境描述" value={extended.environment} onChange={(v) => updateExtended('environment', v)} maxLength={500} rows={4} />
                  </div>
                </PaperPanel>

                <PaperPanel title="学术能力">
                  <TagGroup title="擅长学科 (Strengths)" items={SUBJECTS} selected={extended.strengths} onToggle={(v) => toggleArrayField('strengths', v)} />
                  <TagGroup title="不擅长学科 (Weaknesses)" items={SUBJECTS} selected={extended.weaknesses} onToggle={(v) => toggleArrayField('weaknesses', v)} />
                  <TagGroup title="选修课 (Electives)" items={ELECTIVES} selected={extended.electives} onToggle={(v) => toggleArrayField('electives', v)} />
                  <button type="button" className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-hogwarts-goldDark/30 bg-hogwarts-goldDark/10 px-3 py-2 text-sm text-hogwarts-goldDark">
                    <ScrollText className="h-4 w-4" aria-hidden="true" />
                    我的课表 (Class Schedule)
                  </button>
                </PaperPanel>
              </div>

              <div className="space-y-5">
                <PaperPanel title="魔法档案">
                  <SelectField label="魔杖类型 (Wand)" value={extended.wand} onChange={(v) => updateExtended('wand', v)} options={WAND_TYPES} placeholder="选择魔杖类型" />
                </PaperPanel>

                <PaperPanel title="宠物 (Pet)">
                  <SelectField label="宠物" value={extended.pet} onChange={(v) => updateExtended('pet', v)} options={PETS} />
                </PaperPanel>

                <PaperPanel title="守护神 (Patronus)">
                  <SelectField label="守护神" value={extended.patronus} onChange={(v) => updateExtended('patronus', v)} options={PATRONUS_TYPES} placeholder="选择守护神" />
                </PaperPanel>

                <PaperPanel title="魁地奇 (Quidditch)">
                  <p className="mb-3 text-xs leading-5 text-[#3a2815]">一年级新生不允许加入魁地奇球队，除非你是哈利波特，而且麦格教授刚刚送给你一把光轮2000。</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['是', '否'].map((item) => <ChoiceButton key={item} active={extended.quidditchMember === item} onClick={() => updateExtended('quidditchMember', item)}>{item}</ChoiceButton>)}
                  </div>
                  <TextField label="球队或位置" value={team} onChange={setTeam} className="mt-3" />
                </PaperPanel>

                <PaperPanel title="我的称号">
                  <TextField label="称号" value={wizardTitle} onChange={setWizardTitle} />
                  <TextAreaField label="个人简介" value={publicBio} onChange={setPublicBio} maxLength={300} rows={5} />
                  <div className="mt-3 rounded-md border border-hogwarts-goldDark/30 bg-[#ead8b9] p-3 text-sm leading-6 text-[#2b1c0e]">
                    你还没有解锁工坊称号。等你在工坊里做出更多高品质魔药、药酒、药膳，这里就会慢慢挂满牌子。
                  </div>
                </PaperPanel>
              </div>
            </div>
          </form>

          <footer className="flex shrink-0 justify-end gap-3 border-t border-hogwarts-goldDark/30 bg-hogwarts-goldDark/10 px-5 py-4">
            <button type="button" onClick={() => history.back()} className="rounded-md border border-hogwarts-goldDark/35 px-5 py-2 text-sm font-bold text-hogwarts-goldDark transition-colors hover:bg-hogwarts-goldDark/10">
              取消
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-hogwarts-goldDark px-5 py-2 text-sm font-bold text-hogwarts-paper transition-colors hover:bg-hogwarts-gold disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? <Wand2 className="h-4 w-4 animate-pulse" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
              {saving ? '保存中...' : '确认入学'}
            </button>
          </footer>
        </motion.section>
      </div>
    </DataState>
  );
}

function PaperPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-hogwarts-goldDark/35 bg-[#fff8e8]/90 p-4 shadow-sm">
      <h2 className="mb-3 border-b border-hogwarts-goldDark/35 pb-2 font-magical text-lg text-[#6b481f]">{title}</h2>
      {children}
    </section>
  );
}

function TextField({ label, value, onChange, className = '', maxLength }: { label: string; value: string; onChange: (value: string) => void; className?: string; maxLength?: number }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold text-[#2b1c0e]">{label}</span>
      <input value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-md border border-hogwarts-goldDark/45 bg-[#fffdf7] px-3 text-sm text-[#1f160c] outline-none transition-colors placeholder:text-[#8a6b47] focus:border-hogwarts-goldDark" />
    </label>
  );
}

function TextAreaField({ label, value, onChange, rows, maxLength }: { label: string; value: string; onChange: (value: string) => void; rows: number; maxLength: number }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-bold text-[#2b1c0e]">
        {label}
        <span className="font-normal text-[#6b481f]">{value.length}/{maxLength}</span>
      </span>
      <textarea value={value} rows={rows} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} className="w-full resize-none rounded-md border border-hogwarts-goldDark/45 bg-[#fffdf7] px-3 py-2 text-sm leading-6 text-[#1f160c] outline-none transition-colors placeholder:text-[#8a6b47] focus:border-hogwarts-goldDark" />
    </label>
  );
}

function SelectField({ label, value, onChange, options, placeholder, className = '' }: { label: string; value: string; onChange: (value: string) => void; options: string[]; placeholder?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold text-[#2b1c0e]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-md border border-hogwarts-goldDark/45 bg-[#fffdf7] px-3 text-sm text-[#1f160c] outline-none transition-colors focus:border-hogwarts-goldDark">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-md border px-3 py-2 text-sm font-bold transition-colors ${active ? 'border-hogwarts-goldDark bg-hogwarts-goldDark text-hogwarts-paper' : 'border-hogwarts-goldDark/40 bg-[#fffdf7] text-[#2b1c0e] hover:bg-[#ead8b9]'}`}>
      {children}
    </button>
  );
}

function TagGroup({ title, items, selected, onToggle }: { title: string; items: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-bold text-[#2b1c0e]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.includes(item);
          return (
            <button key={item} type="button" onClick={() => onToggle(item)} className={`rounded-full border px-3 py-1 text-xs transition-colors ${active ? 'border-hogwarts-goldDark bg-hogwarts-goldDark text-hogwarts-paper' : 'border-hogwarts-goldDark/35 bg-[#fffdf7] text-[#2b1c0e] hover:bg-[#ead8b9]'}`}>
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
