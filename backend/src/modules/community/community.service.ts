import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';
import { Follow } from './entities/follow.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FilterPostDto } from './dto/filter-post.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
  ) {}

  // Posts
  async createPost(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const post = this.postRepository.create({
      ...createPostDto,
      author: { id: userId },
      slug: this.generateSlug(createPostDto.title),
    });

    return this.postRepository.save(post);
  }

  async findAllPosts(filterDto: FilterPostDto, currentUserId?: string) {
    const {
      page = 1,
      limit = 10,
      type,
      types,
      categoryId,
      authorId,
      search,
      status = 'published',
      featured,
    } = filterDto;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('author.profile', 'profile')
      .leftJoinAndSelect('post.category', 'category')
      .where('post.status = :status', { status });

    // Ưu tiên lọc theo danh sách nhiều loại (types) nếu có, nếu không thì lọc theo 1 loại (type)
    if (types) {
      const typeList = types
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (typeList.length > 0) {
        queryBuilder.andWhere('post.type IN (:...typeList)', { typeList });
      }
    } else if (type) {
      queryBuilder.andWhere('post.type = :type', { type });
    }

    if (categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId });
    }

    if (authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(post.title LIKE :search OR post.content LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (featured !== undefined) {
      queryBuilder.andWhere('post.isFeatured = :featured', { featured });
    }

    const [posts, total] = await queryBuilder
      .orderBy('post.isPinned', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Check if current user liked each post
    if (currentUserId) {
      const postsWithLikeStatus = await Promise.all(
        posts.map(async (post) => {
          const isLiked = await this.checkUserLiked(currentUserId, 'post', post.id);
          return { ...post, isLiked };
        })
      );

      const totalPages = Math.ceil(total / limit);

      return {
        data: postsWithLikeStatus,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    }

    const totalPages = Math.ceil(total / limit);

    return {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findPostById(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'author.profile', 'category', 'comments', 'comments.author'],
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    // Increment views
    post.views += 1;
    await this.postRepository.save(post);

    return post;
  }

  async findPostBySlug(slug: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { slug },
      relations: ['author', 'author.profile', 'category'],
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    // Increment views
    post.views += 1;
    await this.postRepository.save(post);

    return post;
  }

  async updatePost(id: string, userId: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    if (post.author.id !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    if (updatePostDto.title && updatePostDto.title !== post.title) {
      updatePostDto.slug = this.generateSlug(updatePostDto.title);
    }

    Object.assign(post, updatePostDto);
    return this.postRepository.save(post);
  }

  async deletePost(id: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    if (post.author.id !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    post.status = 'archived';
    await this.postRepository.save(post);
  }

  // Comments
  async addComment(postId: string, userId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    const comment = this.commentRepository.create({
      ...createCommentDto,
      post,
      author: { id: userId },
    });

    const savedComment = await this.commentRepository.save(comment);

    // Update comments count
    post.commentsCount += 1;
    await this.postRepository.save(post);

    return savedComment;
  }

  async getComments(postId: string, page: number = 1, limit: number = 20, currentUserId?: string) {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { post: { id: postId }, status: 'approved', parent: null },
      relations: ['author', 'author.profile', 'replies', 'replies.author', 'replies.author.profile'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    // Add isLiked status for comments and replies if user is authenticated
    let commentsWithLikeStatus = comments;
    if (currentUserId) {
      commentsWithLikeStatus = await Promise.all(
        comments.map(async (comment) => {
          const isLiked = await this.checkUserLiked(currentUserId, 'comment', comment.id);

          // Also check likes for replies
          const repliesWithLikes = await Promise.all(
            (comment.replies || []).map(async (reply) => {
              const replyIsLiked = await this.checkUserLiked(currentUserId, 'comment', reply.id);
              return { ...reply, isLiked: replyIsLiked };
            })
          );

          return { ...comment, isLiked, replies: repliesWithLikes };
        })
      );
    }

    const totalPages = Math.ceil(total / limit);

    return {
      data: commentsWithLikeStatus,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // Likes
  async toggleLike(userId: string, likeableType: 'post' | 'comment', likeableId: string): Promise<{ liked: boolean }> {
    const existingLike = await this.likeRepository.findOne({
      where: { user: { id: userId }, likeableType, likeableId },
    });

    if (existingLike) {
      await this.likeRepository.remove(existingLike);
      await this.updateLikesCount(likeableType, likeableId, -1);
      return { liked: false };
    } else {
      const like = this.likeRepository.create({
        user: { id: userId },
        likeableType,
        likeableId,
      });
      await this.likeRepository.save(like);
      await this.updateLikesCount(likeableType, likeableId, 1);
      return { liked: true };
    }
  }

  // Follows
  async followUser(followerId: string, followingId: string): Promise<{ following: boolean }> {
    if (followerId === followingId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    const existingFollow = await this.followRepository.findOne({
      where: { follower: { id: followerId }, following: { id: followingId } },
    });

    if (existingFollow) {
      await this.followRepository.remove(existingFollow);
      return { following: false };
    } else {
      const follow = this.followRepository.create({
        follower: { id: followerId },
        following: { id: followingId },
      });
      await this.followRepository.save(follow);
      return { following: true };
    }
  }

  async getUserFollowers(userId: string, page: number = 1, limit: number = 20) {
    const [follows, total] = await this.followRepository.findAndCount({
      where: { following: { id: userId } },
      relations: ['follower', 'follower.profile'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);
    
    return {
      data: follows.map(follow => follow.follower),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getUserFollowing(userId: string, page: number = 1, limit: number = 20) {
    const [follows, total] = await this.followRepository.findAndCount({
      where: { follower: { id: userId } },
      relations: ['following', 'following.profile'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);
    
    return {
      data: follows.map(follow => follow.following),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  private async updateLikesCount(type: string, id: string, increment: number): Promise<void> {
    if (type === 'post') {
      await this.postRepository.increment({ id }, 'likesCount', increment);
    } else if (type === 'comment') {
      await this.commentRepository.increment({ id }, 'likesCount', increment);
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + '-' + Date.now();
  }

  // Check if user has liked a post or comment
  async checkUserLiked(userId: string, likeableType: 'post' | 'comment', likeableId: string): Promise<boolean> {
    const like = await this.likeRepository.findOne({
      where: { user: { id: userId }, likeableType, likeableId },
    });
    return !!like;
  }

  // Get community statistics
  async getCommunityStats() {
    const [totalUsers, totalPosts, totalComments] = await Promise.all([
      this.postRepository.query('SELECT COUNT(*) as count FROM users WHERE role = "user"'),
      this.postRepository.count({ where: { status: 'published' } }),
      this.commentRepository.count({ where: { status: 'approved' } }),
    ]);

    return {
      members: parseInt(totalUsers[0]?.count) || 0,
      posts: totalPosts,
      discussions: totalComments,
    };
  }
}