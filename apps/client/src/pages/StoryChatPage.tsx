import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import {
  Backpack,
  BookMarked,
  Dices,
  Feather,
  MapPin,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useUserStore } from '../stores/userStore';

type MessageKind = 'narration' | 'npc' | 'player' | 'roll' | 'clue' | 'quest';

type StoryMessage = {
  id: string;
  kind: MessageKind;
  speaker?: string;
  title?: string;
  text: string;
  roll?: {
    attribute: string;
    dice: number;
    modifier: number;
    dc: number;
    total: number;
    result: string;
  };
};

type StoryState = {
  messages: StoryMessage[];
  clues: string[];
  items: string[];
  danger: number;
  reputation: number;
};

const STORAGE_KEY = 'hogwarts_story_chat_v1';
const PROFILE_MARKER = '---HOGWARTS_ENROLLMENT_V1---';

const initialMessages: StoryMessage[] = [
  {
    id: 'intro',
    kind: 'narration',
    title: '第一章：迟到的猫头鹰',
    text: '霍格沃茨城堡外庭被夜雾轻轻盖住。一只迟到的猫头鹰撞进灯火，爪间攥着一封写错地址的入学通知书，银色蜡封在月光下忽明忽暗。',
  },
  {
    id: 'mcgonagall',
    kind: 'npc',
    speaker: '麦格教授',
    text: '这封信不该出现在这里。孩子，先别声张，看看蜡封和羽毛上还有什么痕迹。',
  },
  {
    id: 'quest-start',
    kind: 'quest',
    title: '任务更新',
    text: '找到寄错的入学通知书来源，并确认黑袍学生是否与此事有关。',
  },
];

const quickActions = ['观察环境', '询问 NPC', '使用物品', '检查线索', '继续前进', '暂时休息', '施放魔咒', '进行判定'];

const attributeModifiers: Record<string, number> = {
  洞察: 2,
  魔咒: 1,
  魅力: 1,
  勇气: 2,
  魔法史: 0,
};

export default function StoryChatPage() {
  const profile = useUserStore((s) => s.profile);
  const [input, setInput] = useState('');
  const [state, setState] = useState<StoryState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as StoryState;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return {
      messages: initialMessages,
      clues: ['银色蜡封', '被烧焦的羽毛'],
      items: ['魔杖', '写错地址的入学通知书', '霍格沃茨地图碎片'],
      danger: 2,
      reputation: 12,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const player = useMemo(() => {
    const wizard = profile?.profile;
    const extended = parseExtendedProfile(wizard?.bio);
    return {
      name: profile?.displayName || '新生巫师',
      house: wizard?.house || '未分院',
      grade: wizard?.grade || '一年级',
      blood: extended.blood || '待登记',
      wand: extended.wand || '未登记魔杖',
      patronus: extended.patronus || '尚未显形',
    };
  }, [profile]);

  const appendMessages = (...messages: StoryMessage[]) => {
    setState((current) => ({ ...current, messages: [...current.messages, ...messages] }));
  };

  const submitAction = (text = input.trim()) => {
    if (!text) return;
    const id = crypto.randomUUID();
    setInput('');

    const playerMessage: StoryMessage = { id, kind: 'player', text };
    const lower = text.toLowerCase();

    if (text.includes('判定') || text.includes('检查') || lower.includes('roll')) {
      const roll = createRoll(text.includes('魔咒') ? '魔咒' : '洞察', 15);
      const resultText = roll.total >= roll.dc
        ? '你捕捉到羽毛边缘有一圈不自然的焦痕，像是某种反追踪咒留下的痕迹。'
        : '雾气干扰了判断，线索暂时变得模糊，但你确定这不是普通猫头鹰造成的事故。';
      appendMessages(
        playerMessage,
        { id: `${id}-roll`, kind: 'roll', text: '进行一次跑团判定。', roll },
        { id: `${id}-clue`, kind: roll.total >= roll.dc ? 'clue' : 'narration', title: roll.total >= roll.dc ? '获得线索' : '旁白', text: resultText },
      );
      if (roll.total >= roll.dc) {
        setState((current) => ({ ...current, clues: Array.from(new Set([...current.clues, '反追踪咒焦痕'])), reputation: current.reputation + 1 }));
      }
      return;
    }

    const response = createNarration(text);
    appendMessages(playerMessage, response);
  };

  const resetStory = () => {
    setState({
      messages: initialMessages,
      clues: ['银色蜡封', '被烧焦的羽毛'],
      items: ['魔杖', '写错地址的入学通知书', '霍格沃茨地图碎片'],
      danger: 2,
      reputation: 12,
    });
  };

  return (
    <main className="grid min-h-[calc(100dvh-7rem)] gap-3 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] 2xl:grid-cols-[260px_minmax(0,1fr)_260px]">
      <aside className="rounded-lg border border-hogwarts-goldDark/30 bg-[#21160f]/86 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-sm">
        <SectionHeading icon={BookMarked} title="剧情状态" />
        <div className="mt-4 space-y-3 text-sm">
          <StatusItem label="当前章节" value="第一章：迟到的猫头鹰" />
          <StatusItem label="当前地点" value="霍格沃茨城堡外庭" />
          <StatusItem label="任务目标" value="找到寄错的入学通知书" />
          <StatusItem label="时间线" value="开学前夜 · 月雾" />
          <StatusItem label="重要 NPC" value="麦格教授 / 猫头鹰邮差 / 黑袍学生" />
          <StatusItem label="危险等级" value={`${state.danger} / 5`} />
          <StatusItem label="学院声望" value={`${state.reputation}`} />
        </div>
        <div className="mt-5 border-t border-hogwarts-goldDark/25 pt-4">
          <SectionHeading icon={Feather} title="已获得线索" small />
          <div className="mt-3 flex flex-wrap gap-2">
            {state.clues.map((clue) => (
              <span key={clue} className="rounded-full border border-hogwarts-gold/30 bg-hogwarts-gold/10 px-3 py-1 text-xs text-hogwarts-paper/80">
                {clue}
              </span>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-lg border border-hogwarts-goldDark/35 bg-[#f3dfbd] bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] text-[#24170e] shadow-[0_22px_70px_rgba(0,0,0,0.28)] lg:min-h-[calc(100dvh-8rem)]">
        <header className="border-b-2 border-[#8b6f3a]/40 bg-[#3a2618]/92 px-5 py-4 text-hogwarts-paper">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-hogwarts-gold/80">Main Story Console</p>
              <h1 className="mt-1 font-magical text-2xl tracking-widest text-hogwarts-gold">主线剧情跑团</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-hogwarts-paper/70">
              <MapPin className="h-4 w-4 text-hogwarts-gold" />
              霍格沃茨城堡外庭
            </div>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {state.messages.map((message) => (
            <StoryBubble key={message.id} message={message} />
          ))}
        </div>

        <footer className="border-t-2 border-[#8b6f3a]/30 bg-[#ead4ae]/95 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => submitAction(action)}
                className="rounded-md border border-[#8b6f3a]/35 bg-[#fff7e5]/70 px-3 py-1.5 text-xs font-bold text-[#3a2618] transition-colors hover:bg-[#8b6f3a] hover:text-hogwarts-paper"
              >
                {action}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submitAction();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="h-12 min-w-0 flex-1 rounded-md border border-[#8b6f3a]/45 bg-[#fffdf7] px-4 text-sm text-[#1f160c] outline-none placeholder:text-[#8a6b47] focus:border-[#6b481f]"
              placeholder="输入你的行动，例如：我检查信封上的蜡封"
            />
            <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-md bg-[#6b481f] px-4 text-sm font-bold text-hogwarts-paper transition-colors hover:bg-[#8b6f3a]">
              <Send className="h-4 w-4" />
              行动
            </button>
          </form>
        </footer>
      </section>

      <aside className="rounded-lg border border-hogwarts-goldDark/30 bg-[#21160f]/86 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-sm lg:col-span-2 2xl:col-span-1">
        <SectionHeading icon={UserRound} title="角色卡" />
        <div className="mt-4 rounded-lg border border-hogwarts-goldDark/30 bg-black/20 p-4">
          <p className="font-magical text-xl text-hogwarts-gold">{player.name}</p>
          <div className="mt-3 space-y-2 text-sm text-hogwarts-paper/72">
            <StatusItem label="学院" value={player.house} compact />
            <StatusItem label="年级" value={player.grade} compact />
            <StatusItem label="血统" value={player.blood} compact />
            <StatusItem label="魔杖" value={player.wand} compact />
            <StatusItem label="守护神" value={player.patronus} compact />
            <StatusItem label="当前状态" value="警觉 / 可行动" compact />
          </div>
        </div>

        <div className="mt-5">
          <SectionHeading icon={Sparkles} title="属性" small />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {Object.entries(attributeModifiers).map(([name, modifier]) => (
              <div key={name} className="rounded-md border border-hogwarts-goldDark/25 bg-black/18 px-3 py-2">
                <p className="text-xs text-hogwarts-paper/45">{name}</p>
                <p className="font-pixel text-sm text-hogwarts-gold">+{modifier}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <SectionHeading icon={Backpack} title="物品栏" small />
          <div className="mt-3 space-y-2">
            {state.items.map((item) => (
              <div key={item} className="rounded-md border border-hogwarts-goldDark/25 bg-black/18 px-3 py-2 text-sm text-hogwarts-paper/72">
                {item}
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={resetStory} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-hogwarts-gold/35 px-4 py-2.5 text-sm font-bold text-hogwarts-gold transition-colors hover:bg-hogwarts-gold/10">
          <RotateCcw className="h-4 w-4" />
          重置第一章
        </button>
      </aside>
    </main>
  );
}

function createRoll(attribute: string, dc: number) {
  const dice = Math.floor(Math.random() * 20) + 1;
  const modifier = attributeModifiers[attribute] ?? 0;
  const total = dice + modifier;
  const result = dice === 20 || total >= dc + 10
    ? '大成功'
    : dice === 1 || total <= dc - 10
      ? '大失败'
      : total >= dc
        ? '成功'
        : '失败';
  return { attribute, dice, modifier, dc, total, result };
}

function parseExtendedProfile(raw?: string | null) {
  if (!raw || !raw.includes(PROFILE_MARKER)) {
    return { blood: '', wand: '', patronus: '' };
  }
  const [, payload] = raw.split(PROFILE_MARKER);
  try {
    const parsed = JSON.parse(payload.trim()) as { blood?: string; wand?: string; patronus?: string };
    return {
      blood: parsed.blood || '',
      wand: parsed.wand || '',
      patronus: parsed.patronus || '',
    };
  } catch {
    return { blood: '', wand: '', patronus: '' };
  }
}

function createNarration(action: string): StoryMessage {
  if (action.includes('询问')) {
    return {
      id: crypto.randomUUID(),
      kind: 'npc',
      speaker: '猫头鹰邮差',
      text: '我只负责送信，先生。可是那只黑色猫头鹰没有登记环，它从禁林方向飞来的。',
    };
  }
  if (action.includes('继续')) {
    return {
      id: crypto.randomUUID(),
      kind: 'quest',
      title: '章节转场',
      text: '你沿着外庭石阶前进，雾里传来轻微脚步声。下一幕将进入城堡侧廊。',
    };
  }
  return {
    id: crypto.randomUUID(),
    kind: 'narration',
    text: `你选择「${action}」。风把长袍边缘吹起，银色蜡封在掌心变得微热，像是在回应你的行动。`,
  };
}

function StoryBubble({ message }: { message: StoryMessage }) {
  const isPlayer = message.kind === 'player';
  const isRoll = message.kind === 'roll';
  const isNpc = message.kind === 'npc';
  const isClue = message.kind === 'clue';
  const isQuest = message.kind === 'quest';

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-[92%] rounded-lg border p-4 text-sm leading-7 shadow-sm ${
        isPlayer
          ? 'ml-auto border-[#6b481f]/25 bg-[#6b481f] text-hogwarts-paper'
          : isRoll
            ? 'border-[#b68a34]/55 bg-[#fff2c6]'
            : isNpc
              ? 'border-[#8b6f3a]/35 bg-[#fff8e8]'
              : isClue || isQuest
                ? 'border-[#b68a34]/60 bg-[#fff5d8]'
                : 'border-[#8b6f3a]/25 bg-[#fffaf0]/78'
      }`}
    >
      {message.title && <p className="mb-1 font-magical text-lg text-[#6b481f]">{message.title}</p>}
      {message.speaker && (
        <p className="mb-1 flex items-center gap-2 font-bold text-[#6b481f]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6b481f]/12">
            <UserRound className="h-4 w-4" />
          </span>
          {message.speaker}
        </p>
      )}
      {message.roll ? (
        <div>
          <div className="mb-3 flex items-center gap-2 font-bold text-[#6b481f]">
            <Dices className="h-5 w-5" />
            {message.roll.attribute}检定
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            <RollStat label="骰子" value={message.roll.dice} />
            <RollStat label="修正" value={`+${message.roll.modifier}`} />
            <RollStat label="最终" value={message.roll.total} />
            <RollStat label="DC" value={message.roll.dc} />
            <RollStat label="结果" value={message.roll.result} wide />
          </div>
        </div>
      ) : (
        <p>{message.text}</p>
      )}
      {isClue && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#6b481f]/10 px-3 py-1 text-xs font-bold text-[#6b481f]">
          <ShieldAlert className="h-3.5 w-3.5" />
          线索已写入记录
        </p>
      )}
    </motion.article>
  );
}

function RollStat({ label, value, wide = false }: { label: string; value: string | number; wide?: boolean }) {
  return (
    <div className={`rounded-md border border-[#b68a34]/35 bg-white/55 px-2 py-2 ${wide ? 'col-span-1' : ''}`}>
      <p className="text-[10px] text-[#6b481f]/65">{label}</p>
      <p className="mt-1 font-pixel text-xs text-[#4a2f15]">{value}</p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, small = false }: { icon: ComponentType<{ className?: string }>; title: string; small?: boolean }) {
  return (
    <h2 className={`flex items-center gap-2 font-magical tracking-wider text-hogwarts-gold ${small ? 'text-base' : 'text-xl'}`}>
      <Icon className="h-5 w-5" />
      {title}
    </h2>
  );
}

function StatusItem({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={compact ? '' : 'rounded-md border border-hogwarts-goldDark/25 bg-black/18 px-3 py-2'}>
      <p className="text-xs text-hogwarts-paper/38">{label}</p>
      <p className="mt-1 text-hogwarts-paper/78">{value}</p>
    </div>
  );
}
