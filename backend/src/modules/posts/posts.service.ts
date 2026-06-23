import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentPost } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FilterPostDto } from './dto/filter-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(ContentPost)
    private postRepository: Repository<ContentPost>,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string): Promise<ContentPost> {
    const post = this.postRepository.create({
      ...createPostDto,
      authorId,
      slug: this.generateSlug(createPostDto.title),
      type: createPostDto.type || 'user_post',
      status: createPostDto.status || 'published',
    });

    return await this.postRepository.save(post);
  }

  async findAll(filterDto: FilterPostDto) {
    const {
      page = 1,
      limit = 12,
      search,
      type,
      status,
      categoryId,
      authorId,
      tag,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('author.profile', 'profile')
      .leftJoinAndSelect('post.category', 'category');

    if (search) {
      queryBuilder.andWhere(
        '(post.title LIKE :search OR post.content LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type) {
      queryBuilder.andWhere('post.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }

    if (categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId });
    }

    if (authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId });
    }

    if (tag) {
      queryBuilder.andWhere('JSON_CONTAINS(post.tags, :tag)', { tag: JSON.stringify(tag) });
    }

    if (featured !== undefined) {
      queryBuilder.andWhere('post.isFeatured = :featured', { featured });
    }

    const [posts, total] = await queryBuilder
      .orderBy(`post.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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
      }
    };
  }

  async findPublished(filterDto: FilterPostDto) {
    return this.findAll({
      ...filterDto,
      status: 'published',
    });
  }

  async findOne(id: string): Promise<ContentPost> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'author.profile', 'category'],
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    // Increment view count
    await this.postRepository.increment({ id }, 'views', 1);

    return post;
  }

  async findBySlug(slug: string): Promise<ContentPost> {
    const post = await this.postRepository.findOne({
      where: { slug, status: 'published' },
      relations: ['author', 'author.profile', 'category'],
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    // Increment view count
    await this.postRepository.increment({ id: post.id }, 'views', 1);

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto, authorId?: string): Promise<ContentPost> {
    const post = await this.findOne(id);

    if (updatePostDto.title && updatePostDto.title !== post.title) {
      post.slug = this.generateSlug(updatePostDto.title);
    }

    // Set authorId if not already set
    if (!post.authorId && authorId) {
      post.authorId = authorId;
    }

    Object.assign(post, updatePostDto);
    await this.postRepository.save(post);

    return this.findOne(id);
  }

  async updateStatus(id: string, status: string): Promise<ContentPost> {
    const post = await this.findOne(id);
    post.status = status;

    await this.postRepository.save(post);
    return this.findOne(id);
  }

  async toggleFeatured(id: string): Promise<ContentPost> {
    const post = await this.findOne(id);
    post.isFeatured = !post.isFeatured;
    await this.postRepository.save(post);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const post = await this.findOne(id);
    await this.postRepository.remove(post);
  }

  async getFeaturedPosts(limit: number = 6): Promise<ContentPost[]> {
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('author.profile', 'profile')
      .leftJoinAndSelect('post.category', 'category')
      .where('post.status = :status', { status: 'published' })
      .andWhere('post.isFeatured = true')
      .orderBy('post.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}