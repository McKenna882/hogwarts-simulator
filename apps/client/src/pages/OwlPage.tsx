import { useEffect, useState, useMemo } from 'react';
import { useChatStore } from '../stores/chatStore';
import CharacterCard from '../components/CharacterCard';
import ChatRoom from '../components/ChatRoom';

export default function OwlPage() {
  const characters = useChatStore((s) => s.characters);
  const charactersLoading = useChatStore((s) => s.charactersLoading);
  const loadCharacters = useChatStore((s) => s.loadCharacters);
  const loadAffinities = useChatStore((s) => s.loadAffinities);
  const selectedCharacter = useChatStore((s) => s.selectedCharacter);
  const selectCharacter = useChatStore((s) => s.selectCharacter);
  const starredCharacters = useChatStore((s) => s.starredCharacters);

  const [search, setSearch] = useState('');
  const [showMobileList, setShowMobileList] = useState(!selectedCharacter);

  useEffect(() => {
    if (characters.length === 0) {
      loadCharacters();
      loadAffinities();
    }
  }, []);

  const handleSelect = (character: any) => {
    selectCharacter(character);
    if (window.innerWidth < 768) {
      setShowMobileList(false);
    }
  };

  // 筛选 + 星标排序
  const sorted = useMemo(() => {
    const filtered = characters.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.house && c.house.includes(search)) ||
        (c.title && c.title.includes(search)),
    );
    // 星标置顶
    return [...filtered].sort((a, b) => {
      const aStar = starredCharacters[a.id] ? 1 : 0;
      const bStar = starredCharacters[b.id] ? 1 : 0;
      return bStar - aStar;
    });
  }, [characters, search, starredCharacters]);

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] gap-4">
      <div
        className={`${
          showMobileList ? 'flex' : 'hidden'
        } md:flex xl:hidden flex-col w-full md:w-72 flex-shrink-0`}
      >
        <div className="mb-3">
          <h1 className="font-display text-2xl text-gold mb-1">🦉 猫头鹰邮局</h1>
          <p className="text-parchment/40 text-xs">选择角色开始聊天</p>
        </div>

        <input
          className="w-full px-3 py-2 bg-black/40 border border-gold/20 rounded-lg text-parchment placeholder:text-parchment/30 text-sm focus:outline-none focus:border-gold/50 mb-3"
          placeholder="搜索角色、学院或称号..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {charactersLoading ? (
            <div className="text-center text-parchment/30 py-8 text-sm">加载中...</div>
          ) : sorted.length === 0 ? (
            <div className="text-center text-parchment/30 py-8 text-sm">没有匹配的角色</div>
          ) : (
            sorted.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                active={selectedCharacter?.id === char.id}
                onClick={() => handleSelect(char)}
              />
            ))
          )}
        </div>
      </div>

      <div className="hidden md:block xl:hidden w-px bg-gold/20" />

      <div
        className={`${
          !showMobileList ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col bg-black/20 rounded-lg border border-gold/10 overflow-hidden`}
      >
        <ChatRoom />

        <button
          className="md:hidden absolute top-2 left-2 text-parchment/50 hover:text-gold text-sm"
          onClick={() => setShowMobileList(true)}
        >
          ← 返回
        </button>
      </div>
    </div>
  );
}
