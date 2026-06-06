import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  // ── 会话 ──

  async getConversations(userId: string) {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { memberType: 'user', memberId: userId },
      include: {
        conversation: {
          include: {
            character: {
              select: { id: true, name: true, avatarUrl: true, house: true, title: true },
            },
            members: {
              where: { memberType: 'user' },
              select: { memberId: true },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { content: true, createdAt: true, senderType: true },
            },
          },
        },
      },
      orderBy: { conversation: { createdAt: 'desc' } },
    });

    return memberships
      .filter((m) => m.conversation.character)
      .map((m) => ({
        id: m.conversation.id,
        character: m.conversation.character,
        lastMessage: m.conversation.messages[0] || null,
        createdAt: m.conversation.createdAt,
      }));
  }

  async getAllAffinities(userId: string) {
    const affs = await this.prisma.characterAffinity.findMany({
      where: { userId },
    });
    return affs.map((a) => ({ characterId: a.characterId, affinity: a.affinity }));
  }

  async createConversation(userId: string, characterId: string) {
    // 查角色是否存在
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });
    if (!character) throw new NotFoundException('角色不存在');

    // 查是否已有会话 — 通过 Conversation 直接查找
    const existingConv = await this.prisma.conversation.findFirst({
      where: {
        characterId,
        members: {
          some: { memberType: 'user', memberId: userId },
        },
      },
      include: {
        character: {
          select: { id: true, name: true, avatarUrl: true, house: true, title: true },
        },
      },
    });

    if (existingConv) {
      return {
        id: existingConv.id,
        character: existingConv.character,
        existing: true,
      };
    }

    // 创建新会话
    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'private',
        characterId,
        title: character.name,
        members: {
          create: [
            { memberType: 'user', memberId: userId, role: 'owner' },
            { memberType: 'character', memberId: characterId, role: 'member' },
          ],
        },
      },
      include: {
        character: {
          select: { id: true, name: true, avatarUrl: true, house: true, title: true },
        },
      },
    });

    // 如果有开场白，插入第一条消息
    if (character.greeting) {
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'character',
          senderId: characterId,
          content: character.greeting,
        },
      });
    }

    return {
      id: conversation.id,
      character: conversation.character,
      existing: false,
    };
  }

  // ── 消息 ──

  async getMessages(conversationId: string, userId: string, page = 1, limit = 30) {
    // 验证会话归属
    await this.validateConversationMember(conversationId, userId);

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          senderType: true,
          senderId: true,
          content: true,
          createdAt: true,
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      messages: messages.reverse(),
      total,
      page,
      hasMore: skip + limit < total,
    };
  }

  async sendMessage(conversationId: string, userId: string, content: string) {
    // 验证会话归属
    const conversation = await this.validateConversationMember(conversationId, userId);

    // 保存用户消息
    await this.prisma.message.create({
      data: {
        conversationId,
        senderType: 'user',
        senderId: userId,
        content,
      },
    });

    // 获取角色 systemPrompt
    const character = await this.prisma.character.findUnique({
      where: { id: conversation.characterId },
    });
    if (!character) throw new NotFoundException('角色不存在');

    // 获取好感度
    let affinity = 0;
    try {
      const aff = await this.prisma.characterAffinity.findUnique({
        where: { userId_characterId: { userId, characterId: character.id } },
      });
      affinity = aff?.affinity || 0;
    } catch {}

    // 获取最近的消息历史
    const recentMessages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    recentMessages.reverse();

    // 组装 AI 上下文
    const affinityDesc = affinity >= 80 ? '非常亲密' : affinity >= 60 ? '友好' : affinity >= 40 ? '一般' : affinity >= 20 ? '陌生' : '冷淡';
    const systemPrompt = `${character.systemPrompt || `你是霍格沃茨的 ${character.name}（${character.house || '未知'}学院）。请用符合角色性格的方式回复，语气自然，2-4句话，中文。`}\n\n你和对方的关系：${affinityDesc}（好感度 ${affinity}/100）。请根据这个关系程度调整语气。`;
    const aiMessages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of recentMessages) {
      if (msg.senderType === 'user') {
        aiMessages.push({ role: 'user', content: msg.content });
      } else if (msg.senderType === 'character') {
        aiMessages.push({ role: 'assistant', content: msg.content });
      }
    }

    // 调用 AI
    let replyContent: string;
    try {
      replyContent = await this.ai.chatCompletion(aiMessages);
    } catch (error) {
      this.logger.error('AI 回复失败', error);
      replyContent = this.ai.getFriendlyError(error);
    }

    // 保存 AI 回复
    const aiMessage = await this.prisma.message.create({
      data: {
        conversationId,
        senderType: 'character',
        senderId: character.id,
        content: replyContent,
      },
    });

    // 更新好感度
    try {
      const existing = await this.prisma.characterAffinity.findUnique({
        where: {
          userId_characterId: {
            userId,
            characterId: character.id,
          },
        },
      });

      const newAffinity = Math.min(100, (existing?.affinity || 0) + 1);
      await this.prisma.characterAffinity.upsert({
        where: {
          userId_characterId: {
            userId,
            characterId: character.id,
          },
        },
        create: {
          userId,
          characterId: character.id,
          affinity: 1,
        },
        update: {
          affinity: newAffinity,
        },
      });
    } catch {} // 好感度更新失败不影响主流程

    return {
      reply: {
        id: aiMessage.id,
        senderType: 'character',
        senderId: character.id,
        content: replyContent,
        createdAt: aiMessage.createdAt,
      },
    };
  }

  async validateConversationMember(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('会话不存在');

    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_memberId: {
          conversationId,
          memberId: userId,
        },
      },
    });
    if (!member) throw new NotFoundException('你不是该会话的成员');

    return conversation;
  }

  // -- Gateway methods --

  async saveMessage(convId: string, senderType: string, senderId: string, content: string) {
    return this.prisma.message.create({
      data: { conversationId: convId, senderType, senderId, content },
      select: { id: true, senderType: true, senderId: true, content: true, createdAt: true },
    });
  }

  async getConversationCharacter(convId: string) {
    var conv = await this.prisma.conversation.findUnique({
      where: { id: convId }, include: { character: true },
    });
    if (!conv || !conv.character) throw new NotFoundException("角色不存在");
    return conv.character;
  }

  async getCharacterAffinity(userId: string, characterId: string): Promise<number> {
    try {
      var aff = await this.prisma.characterAffinity.findUnique({
        where: { userId_characterId: { userId, characterId } },
      });
      return aff ? aff.affinity : 0;
    } catch { return 0; }
  }

  async buildAiContext(convId: string, character: any, affinity: number) {
    var msgs = await this.prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    msgs.reverse();
    var idx = Math.max(0, Math.min(4, Math.floor(affinity / 20)));
    var labels = ["冷淡", "陌生", "一般", "友好", "非常亲密"];
    var base = character.systemPrompt || ("你是霍格沃茨的" + character.name);
    var sys = `${base}
你和对方的关系：${labels[idx]}（好感度${affinity}/100）`;
    var result: any[] = [{ role: "system", content: sys }];
    for (var m of msgs) {
      if (m.senderType === "user") result.push({ role: "user", content: m.content });
      else if (m.senderType === "character") result.push({ role: "assistant", content: m.content });
    }
    return result;
  }

  async createPendingAiMessage(convId: string, characterId: string): Promise<string> {
    var msg = await this.prisma.message.create({
      data: { conversationId: convId, senderType: "character", senderId: characterId, content: "" },
    });
    return msg.id;
  }

  async finalizeAiMessage(messageId: string, content: string) {
    return this.prisma.message.update({
      where: { id: messageId }, data: { content },
      select: { id: true, senderType: true, senderId: true, content: true, createdAt: true },
    });
  }

  async updateAffinity(userId: string, characterId: string) {
    var existing = await this.prisma.characterAffinity.findUnique({
      where: { userId_characterId: { userId, characterId } },
    });
    var next = Math.min(100, (existing ? existing.affinity : 0) + 1);
    await this.prisma.characterAffinity.upsert({
      where: { userId_characterId: { userId, characterId } },
      create: { userId, characterId, affinity: 1 },
      update: { affinity: next },
    });
  }

}
