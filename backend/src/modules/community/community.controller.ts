import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FilterPostDto } from './dto/filter-post.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt.guard';

@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // Posts
  @Post('posts')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createPost(
    @CurrentUser('id') userId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.communityService.createPost(userId, createPostDto);
  }

  @Get('posts')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all posts with filters' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  findAllPosts(
    @Query() filterDto: FilterPostDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.communityService.findAllPosts(filterDto, userId);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  findPost(@Param('id') id: string) {
    return this.communityService.findPostById(id);
  }

  @Get('posts/slug/:slug')
  @ApiOperation({ summary: 'Get post by slug' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  findPostBySlug(@Param('slug') slug: string) {
    return this.communityService.findPostBySlug(slug);
  }

  @Put('posts/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update post' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  updatePost(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.communityService.updatePost(id, userId, updatePostDto);
  }

  @Delete('posts/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete post' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.communityService.deletePost(id, userId);
    return { message: 'Post deleted successfully' };
  }

  // Comments
  @Post('posts/:id/comments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add comment to post' })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  addComment(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.communityService.addComment(postId, userId, createCommentDto);
  }

  @Get('posts/:id/comments')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get post comments' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  getComments(
    @Param('id') postId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @CurrentUser('id') userId?: string,
  ) {
    return this.communityService.getComments(postId, Number(page), Number(limit), userId);
  }

  // Likes
  @Post('like/:type/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle like on post or comment' })
  @ApiResponse({ status: 200, description: 'Like toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  toggleLike(
    @CurrentUser('id') userId: string,
    @Param('type') type: 'post' | 'comment',
    @Param('id') id: string,
  ) {
    return this.communityService.toggleLike(userId, type, id);
  }

  // Follows
  @Post('follow/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Follow/Unfollow user' })
  @ApiResponse({ status: 200, description: 'Follow status toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot follow yourself' })
  followUser(
    @CurrentUser('id') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.communityService.followUser(followerId, followingId);
  }

  @Get('users/:userId/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiResponse({ status: 200, description: 'Followers retrieved successfully' })
  getUserFollowers(
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.communityService.getUserFollowers(userId, Number(page), Number(limit));
  }

  @Get('users/:userId/following')
  @ApiOperation({ summary: 'Get user following' })
  @ApiResponse({ status: 200, description: 'Following retrieved successfully' })
  getUserFollowing(
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.communityService.getUserFollowing(userId, Number(page), Number(limit));
  }

  // Community Stats
  @Get('stats')
  @ApiOperation({ summary: 'Get community statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  getCommunityStats() {
    return this.communityService.getCommunityStats();
  }
}