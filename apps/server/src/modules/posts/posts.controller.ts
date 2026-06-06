import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  getPosts(@Query('page') page = '1') {
    return this.postsService.getPosts(+page);
  }

  @Post()
  createPost(
    @CurrentUser('userId') userId: string,
    @Body() body: { content: string; imageUrl?: string },
  ) {
    return this.postsService.createPost(userId, body.content, body.imageUrl);
  }

  @Delete(':id')
  deletePost(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.postsService.deletePost(userId, id);
  }

  @Post(':id/like')
  toggleLike(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.postsService.toggleLike(userId, id);
  }

  @Post(':id/comments')
  addComment(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.postsService.addComment(userId, id, body.content);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.postsService.getComments(id);
  }
}
