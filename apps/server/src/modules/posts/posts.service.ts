import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async getPosts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { visibility: 'public' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.post.count({ where: { visibility: 'public' } }),
    ]);
    return { posts, total, page, hasMore: skip + limit < total };
  }

  async createPost(userId: string, content: string, imageUrl?: string) {
    const post = await this.prisma.post.create({
      data: { userId, content, imageUrl, visibility: 'public' },
    });
    return post;
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('动态不存在');
    if (post.userId !== userId) throw new ForbiddenException('只能删除自己的动态');
    await this.prisma.post.delete({ where: { id: postId } });
    return { success: true };
  }

  async toggleLike(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('动态不存在');

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.postLike.delete({ where: { id: existing.id } });
      return { liked: false };
    } else {
      await this.prisma.postLike.create({ data: { postId, userId } });
      return { liked: true };
    }
  }

  async addComment(userId: string, postId: string, content: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('动态不存在');
    return this.prisma.postComment.create({
      data: { postId, userId, content },
    });
  }

  async getComments(postId: string) {
    return this.prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
