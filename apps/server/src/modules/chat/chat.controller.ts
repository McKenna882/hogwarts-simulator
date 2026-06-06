import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ── 会话 ──

  @Get('conversations')
  getConversations(@CurrentUser('userId') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Post('conversations')
  createConversation(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(userId, dto.characterId);
  }

  // ── 消息 ──

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Query('page') page = '1',
  ) {
    return this.chatService.getMessages(id, userId, +page);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(id, userId, dto.content);
  }

  // ── 好感度 ──

  @Get('affinities')
  getAffinities(@CurrentUser('userId') userId: string) {
    return this.chatService.getAllAffinities(userId);
  }
}
