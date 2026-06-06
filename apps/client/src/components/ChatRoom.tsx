import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useChatStore, Message } from '../stores/chatStore';

export default function ChatRoom() {
  const selectedCharacter = useChatStore((s) => s.selectedCharacter);
  const messages = useChatStore((s) => s.messages);
  const sending = useChatStore((s) => s.sending);
  const messagesLoading = useChatStore((s) => s.messagesLoading);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!selectedCharacter) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🦉</div>
          <p className="text-parchment/40 text-lg">选择一个角色开始聊天</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 聊天头部 */}
      <div className="flex items-center gap-3 p-4 border-b border-gold/20">
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-lg border border-gold/30">
          {selectedCharacter.name.charAt(0)}
        </div>
        <div>
          <h3 className="text-gold font-medium">{selectedCharacter.name}</h3>
          <p className="text-parchment/40 text-xs">{selectedCharacter.title || selectedCharacter.grade}</p>
        </div>
      </div>

      {/* 消息列表 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messagesLoading ? (
          <div className="text-center text-parchment/30 py-8">加载中...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-parchment/30 py-8">
            <p>发送第一条消息开始对话</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} characterName={selectedCharacter.name} />
          ))
        )}

        {sending && !useChatStore.getState().streamingMessageId && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-sm border border-gold/30">
              {selectedCharacter.name.charAt(0)}
            </div>
            <div className="bg-black/40 border border-gold/20 rounded-lg rounded-tl-none px-3 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <ChatInput onSend={sendMessage} disabled={sending} />
    </div>
  );
}

function MessageBubble({ message, characterName }: { message: Message; characterName: string }) {
  const isUser = message.senderType === 'user';
  const isSystem = message.senderType === 'system';

  if (isSystem) {
    return (
      <div className="text-center text-parchment/40 text-sm py-2">
        {message.content}
      </div>
    );
  }

  return (
    <motion.div
      className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-sm border border-gold/30 flex-shrink-0">
          {characterName.charAt(0)}
        </div>
      )}

      <div
        className={`max-w-[80%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
          isUser
            ? 'bg-gold/20 border border-gold/30 text-parchment rounded-tr-none'
            : 'bg-black/40 border border-gold/20 text-parchment rounded-tl-none'
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

function ChatInput({ onSend, disabled }: { onSend: (content: string) => void; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const input = inputRef.current;
    if (!input || !input.value.trim() || disabled) return;
    onSend(input.value);
    input.value = '';
  };

  return (
    <div className="flex items-center gap-2 p-4 border-t border-gold/20 bg-black/20">
      <input
        ref={inputRef}
        className="flex-1 px-4 py-2.5 bg-black/40 border border-gold/30 rounded-lg text-parchment placeholder:text-parchment/30 focus:outline-none focus:border-gold text-sm"
        placeholder="输入消息..."
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={disabled}
      />
      <button
        className="px-4 py-2.5 bg-gold/80 hover:bg-gold text-black font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
        onClick={handleSubmit}
        disabled={disabled}
      >
        发送
      </button>
    </div>
  );
}
