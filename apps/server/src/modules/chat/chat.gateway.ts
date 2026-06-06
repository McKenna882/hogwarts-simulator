import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { AiService } from './ai.service';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/ws',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
    private aiService: AiService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.query.token as string;
    if (!token) {
      client.emit('message:error', { message: '缺少认证令牌' });
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'hogwarts-dev-jwt-secret-2024',
      });
      client.data.userId = payload.sub;
      client.data.email = payload.email;
      this.logger.log(`🦉 WebSocket 已连接: ${payload.email}`);
    } catch {
      client.emit('message:error', { message: '认证令牌无效' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket 已断开: ${client.data.email || 'unknown'}`);
  }

  // 加入会话房间（用于 typing 等事件）
  @SubscribeMessage('chat:join')
  handleJoinRoom(client: Socket, conversationId: string) {
    client.join(`conv:${conversationId}`);
  }

  // 离开会话房间
  @SubscribeMessage('chat:leave')
  handleLeaveRoom(client: Socket, conversationId: string) {
    client.leave(`conv:${conversationId}`);
  }

  // 发送消息
  @SubscribeMessage('chat:send')
  async handleMessage(client: Socket, payload: { conversationId: string; content: string }) {
    const userId = client.data.userId;
    if (!userId || !payload.conversationId || !payload.content?.trim()) {
      client.emit('message:error', { message: '参数无效' });
      return;
    }

    const conversationId = payload.conversationId;
    const content = payload.content.trim();

    try {
      // 1. 验证会话归属
      const conversation = await this.chatService.validateConversationMember(conversationId, userId);
      if (!conversation) {
        client.emit('message:error', { message: '会话不存在或无权限' });
        return;
      }

      // 2. 保存用户消息
      const userMessage = await this.chatService.saveMessage(conversationId, 'user', userId, content);

      // 3. 广播用户消息给房间
      client.to(`conv:${conversationId}`).emit('message:new', userMessage);
      client.emit('message:new', userMessage);

      // 4. 获取角色和上下文
      const character = await this.chatService.getConversationCharacter(conversationId);
      const affinity = await this.chatService.getCharacterAffinity(userId, character.id);
      const messages = await this.chatService.buildAiContext(conversationId, character, affinity);

      // 5. 构建流式 AI 回复
      const replyMessageId = await this.chatService.createPendingAiMessage(conversationId, character.id);

      let fullContent = '';
      try {
        await this.aiService.streamChatCompletion(messages, (chunk) => {
          fullContent += chunk;
          // 推送到发送者
          client.emit('message:stream', {
            messageId: replyMessageId,
            chunk,
            conversationId,
          });
          // 也广播给房间其他人
          client.to(`conv:${conversationId}`).emit('message:stream', {
            messageId: replyMessageId,
            chunk,
            conversationId,
          });
        });
      } catch (error) {
        this.logger.error('AI 流式回复失败', error);
        fullContent = this.aiService.getFriendlyError(error);
        client.emit('message:stream', {
          messageId: replyMessageId,
          chunk: fullContent,
          conversationId,
        });
      }

      // 6. 保存完整的 AI 回复到数据库
      const aiMessage = await this.chatService.finalizeAiMessage(replyMessageId, fullContent);

      // 7. 更新好感度
      await this.chatService.updateAffinity(userId, character.id).catch(() => {});

      // 8. 通知流结束
      const donePayload = {
        messageId: replyMessageId,
        conversationId,
        content: fullContent,
        createdAt: aiMessage.createdAt,
      };
      client.emit('message:done', donePayload);
      client.to(`conv:${conversationId}`).emit('message:done', donePayload);

    } catch (error) {
      this.logger.error('消息处理失败', error);
      client.emit('message:error', { message: '消息处理失败' });
    }
  }

  // 正在输入
  @SubscribeMessage('chat:typing')
  handleTyping(client: Socket, conversationId: string) {
    client.to(`conv:${conversationId}`).emit('chat:typing', {
      conversationId,
      userId: client.data.userId,
    });
  }
}
