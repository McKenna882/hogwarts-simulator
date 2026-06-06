import { Character, useChatStore } from '../stores/chatStore';

const houseColors: Record<string, string> = {
  '格兰芬多': 'bg-red-800 text-red-200',
  '斯莱特林': 'bg-green-800 text-green-200',
  '拉文克劳': 'bg-blue-900 text-blue-200',
  '赫奇帕奇': 'bg-yellow-700 text-yellow-200',
};

export default function CharacterCard({
  character,
  active,
  onClick,
}: {
  character: Character;
  active: boolean;
  onClick: () => void;
}) {
  const houseColor = character.house ? houseColors[character.house] || 'bg-gray-700' : 'bg-gray-700';
  const affinity = useChatStore((s) => s.affinities[character.id] || 0);
  const isStarred = useChatStore((s) => s.starredCharacters[character.id]);
  const toggleStar = useChatStore((s) => s.toggleStar);

  const affinityColor =
    affinity >= 80 ? 'text-pink-400' :
    affinity >= 60 ? 'text-green-400' :
    affinity >= 40 ? 'text-yellow-400' :
    affinity >= 20 ? 'text-orange-400' :
    'text-gray-500';

  const affinityHearts =
    affinity >= 80 ? '💚' :
    affinity >= 60 ? '💛' :
    affinity >= 40 ? '🧡' :
    affinity >= 20 ? '❤️' :
    '🖤';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
        active
          ? 'bg-gold/15 border border-gold/40'
          : 'bg-black/30 border border-transparent hover:bg-black/50 hover:border-gold/20'
      }`}
    >
      {/* 头像占位 */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-xl flex-shrink-0 border border-gold/30 relative">
        {character.name.charAt(0)}
        {isStarred && (
          <span className="absolute -top-1 -right-1 text-xs">⭐</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-parchment font-medium truncate">{character.name}</span>
          {character.house && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${houseColor}`}>
              {character.house}
            </span>
          )}
        </div>
        <p className="text-parchment/40 text-xs truncate mt-0.5">
          {character.title || character.grade || '霍格沃茨成员'}
        </p>
        {/* 好感度条 */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-xs ${affinityColor}`}>{affinityHearts}</span>
          <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden max-w-[80px]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                affinity >= 80 ? 'bg-pink-400' :
                affinity >= 60 ? 'bg-green-400' :
                affinity >= 40 ? 'bg-yellow-400' :
                'bg-gray-500'
              }`}
              style={{ width: `${(affinity / 100) * 100}%` }}
            />
          </div>
          <span className={`text-xs ${affinityColor} font-display`}>{affinity}</span>
        </div>
      </div>

      {/* 星标按钮 */}
      <button
        type="button"
        aria-label={isStarred ? '取消星标' : '添加星标'}
        className={`text-sm flex-shrink-0 ${isStarred ? 'text-gold' : 'text-parchment/20 hover:text-parchment/40'}`}
        onClick={(e) => { e.stopPropagation(); toggleStar(character.id); }}
      >
        {isStarred ? '⭐' : '☆'}
      </button>
    </div>
  );
}
