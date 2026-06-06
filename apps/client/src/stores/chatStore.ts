import { create } from "zustand";
import { chatApi } from "../api/endpoints";
import { getSocket } from "../hooks/useSocket";

export interface Character {
  id: string; name: string; avatarUrl: string | null;
  house: string | null; grade: string | null; title: string | null;
  description: string | null; greeting: string | null;
}
export interface ConversationInfo {
  id: string; character: Character;
  lastMessage: { content: string; createdAt: string; senderType: string } | null;
  createdAt: string;
}
export interface Message {
  id: string; senderType: string; senderId: string;
  content: string; createdAt: string;
}

interface ChatState {
  characters: Character[]; charactersLoading: boolean; loadCharacters: () => Promise<void>;
  affinities: Record<string, number>; loadAffinities: () => Promise<void>;
  conversations: ConversationInfo[]; conversationsLoading: boolean; loadConversations: () => Promise<void>;
  selectedCharacter: Character | null; activeConversationId: string | null;
  messages: Message[]; messagesLoading: boolean; sending: boolean;
  streamingContent: string; streamingMessageId: string | null;
  starredCharacters: Record<string, boolean>; toggleStar: (id: string) => void;
  selectCharacter: (c: Character) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  handleStreamChunk: (data: any) => void;
  handleStreamDone: (data: any) => void;
  handleStreamError: (message?: string) => void;
  loadMessages: () => Promise<void>;
}

function loadStarred(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem("hp_starred") || "{}"); } catch { return {}; }
}
function saveStarred(s: Record<string, boolean>) {
  localStorage.setItem("hp_starred", JSON.stringify(s));
}

export const useChatStore = create<ChatState>((set, get) => ({
  characters: [], charactersLoading: false,
  loadCharacters: async () => {
    set({ charactersLoading: true });
    try { var res = await chatApi.getCharacters(); set({ characters: res.data, charactersLoading: false }); }
    catch { set({ charactersLoading: false }); }
  },

  affinities: {},
  loadAffinities: async () => {
    try {
      var res = await chatApi.getAffinities();
      var m: Record<string, number> = {};
      (res.data || []).forEach(function (a: any) { m[a.characterId] = a.affinity; });
      set({ affinities: m });
    } catch {}
  },

  conversations: [], conversationsLoading: false,
  loadConversations: async () => {
    set({ conversationsLoading: true });
    try { var res = await chatApi.getConversations(); set({ conversations: res.data, conversationsLoading: false }); }
    catch { set({ conversationsLoading: false }); }
  },
  selectedCharacter: null, activeConversationId: null,
  messages: [], messagesLoading: false, sending: false,
  streamingContent: "", streamingMessageId: null,

  starredCharacters: loadStarred(),
  toggleStar: function (id: string) {
    var current = get().starredCharacters;
    var next = Object.assign({}, current);
    next[id] = !next[id];
    set({ starredCharacters: next });
    saveStarred(next);
  },

  selectCharacter: async function (character: Character) {
    set({ selectedCharacter: character, messages: [], messagesLoading: true });
    try {
      var convRes = await chatApi.createConversation(character.id);
      var convId = convRes.data.id;
      set({ activeConversationId: convId });
      var msgRes = await chatApi.getMessages(convId);
      set({ messages: msgRes.data.messages || [], messagesLoading: false });
      get().loadConversations();
      get().loadAffinities();
    } catch { set({ messagesLoading: false }); }
  },

  loadMessages: async function () {
    var convId = get().activeConversationId;
    if (!convId) return;
    set({ messagesLoading: true });
    try { var res = await chatApi.getMessages(convId); set({ messages: res.data.messages || [], messagesLoading: false }); }
    catch { set({ messagesLoading: false }); }
  },
  handleStreamChunk: function (data: any) {
    var s = get().streamingContent;
    var mid = get().streamingMessageId;
    if (mid !== data.messageId) {
      var placeholder: Message = {
        id: data.messageId, senderType: "character",
        senderId: (get().selectedCharacter && get().selectedCharacter.id) || "",
        content: data.chunk || "", createdAt: new Date().toISOString(),
      };
      set({ messages: [...get().messages, placeholder], streamingContent: data.chunk, streamingMessageId: data.messageId });
    } else {
      var newContent = s + data.chunk;
      set({ streamingContent: newContent });
      set(function (state: any) {
        return { messages: state.messages.map(function (m: any) { if (m.id === data.messageId) { m.content = newContent; } return m; }) };
      });
    }
  },

  handleStreamDone: function (data: any) {
    set(function (state: any) {
      var msgs = state.messages.map(function (m: any) {
        if (m.id === data.messageId) { m.content = data.content; m.createdAt = data.createdAt; }
        return m;
      });
      return { messages: msgs, streamingContent: "", streamingMessageId: null, sending: false };
    });
    get().loadConversations();
    get().loadAffinities();
  },

  handleStreamError: function (message?: string) {
    set(function (state: ChatState) {
      return {
        sending: false,
        streamingContent: "",
        streamingMessageId: null,
        messages: [
          ...state.messages,
          {
            id: "err-" + Date.now(),
            senderType: "system",
            senderId: "system",
            content: message || "消息发送失败",
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
  },

  sendMessage: async function (content: string) {
    var convId = get().activeConversationId;
    var character = get().selectedCharacter;
    if (!convId || !character || !content.trim()) return;
    var tempMsg: Message = {
      id: "temp-" + Date.now(), senderType: "user", senderId: "self",
      content: content.trim(), createdAt: new Date().toISOString(),
    };
    set({ messages: [...get().messages, tempMsg], sending: true });
    var sock = getSocket();
    if (sock && sock.connected) {
      sock.emit("chat:send", { conversationId: convId, content: content.trim() });
    } else {
      // REST fallback
      try {
        var res = await chatApi.sendMessage(convId, content.trim());
        var reply = res.data.reply;
        set({ messages: [...get().messages, reply], sending: false });
        get().loadConversations();
        get().loadAffinities();
      } catch {
        set({ messages: [...get().messages, { id: "err-" + Date.now(), senderType: "system", senderId: "system", content: "发送失败", createdAt: new Date().toISOString() }], sending: false });
      }
    }
  },
}));
