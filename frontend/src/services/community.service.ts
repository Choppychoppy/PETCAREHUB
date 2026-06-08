import { apiClient } from '@/lib/api/client'
import type { Post, Comment, Like, Follow, Contest, ContestEntry, PaginatedResponse } from '@/types'

class CommunityService {
  // =============== POSTS ===============

  /**
   * Get all community posts with pagination and filters
   */
  async getPosts(params?: {
    type?: 'blog' | 'user' | 'news' | 'question'
    types?: string
    page?: number
    limit?: number
    userId?: string
  }): Promise<PaginatedResponse<Post>> {
    return await apiClient.get<PaginatedResponse<Post>>('/community/posts', { params })
  }

  /**
   * Get a single post by ID
   */
  async getPostById(id: string): Promise<Post> {
    return await apiClient.get<Post>(`/community/posts/${id}`)
  }

  /**
   * Upload a single image to Cloudinary
   */
  private async uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    // apiClient already unwraps response.data.data, so we get { url, publicId, ... } directly
    const result = await apiClient.post<{ url: string; publicId: string }>('/upload/image', formData)
    return result.url
  }

  /**
   * Create a new post
   */
  async createPost(data: {
    title: string
    content: string
    type?: 'user' | 'question'
    images?: File[]
  }): Promise<Post> {
    // First upload images to Cloudinary if any
    let imageUrls: string[] = []
    if (data.images && data.images.length > 0) {
      const uploadPromises = data.images.map(file => this.uploadImage(file))
      imageUrls = await Promise.all(uploadPromises)
    }

    // Then create post with image URLs
    return await apiClient.post<Post>('/community/posts', {
      title: data.title,
      content: data.content,
      type: data.type || 'user',
      images: imageUrls.length > 0 ? imageUrls : undefined
    })
  }

  /**
   * Update a post
   */
  async updatePost(id: string, data: Partial<Post> & { newImages?: File[] }): Promise<Post> {
    // Upload new images if any
    let newImageUrls: string[] = []
    if (data.newImages && data.newImages.length > 0) {
      const uploadPromises = data.newImages.map(file => this.uploadImage(file))
      newImageUrls = await Promise.all(uploadPromises)
    }

    // Combine existing images with new uploaded images
    const { newImages, ...postData } = data
    if (newImageUrls.length > 0) {
      const existingImages = (postData.images as string[]) || []
      postData.images = [...existingImages, ...newImageUrls]
    }

    return await apiClient.put<Post>(`/community/posts/${id}`, postData)
  }

  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`/community/posts/${id}`)
  }

  // =============== LIKES ===============

  /**
   * Like a post or comment
   */
  async toggleLike(likeableType: 'post' | 'comment', likeableId: string): Promise<{ liked: boolean }> {
    return await apiClient.post(`/community/like/${likeableType}/${likeableId}`)
  }

  // =============== COMMENTS ===============

  /**
   * Get comments for a post
   */
  async getComments(postId: string): Promise<Comment[]> {
    return await apiClient.get<Comment[]>(`/community/posts/${postId}/comments`)
  }

  /**
   * Create a comment on a post
   */
  async createComment(postId: string, data: {
    content: string
    parentId?: string
  }): Promise<Comment> {
    return await apiClient.post<Comment>(`/community/posts/${postId}/comments`, data)
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string): Promise<Comment> {
    return await apiClient.put<Comment>(`/community/comments/${commentId}`, { content })
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/community/comments/${commentId}`)
  }

  // =============== FOLLOWS ===============

  /**
   * Follow/Unfollow a user
   */
  async toggleFollow(userId: string): Promise<{ following: boolean }> {
    return await apiClient.post(`/community/follow/${userId}`)
  }

  /**
   * Get user's followers
   */
  async getFollowers(userId: string): Promise<Follow[]> {
    return await apiClient.get<Follow[]>(`/community/users/${userId}/followers`)
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(userId: string): Promise<Follow[]> {
    return await apiClient.get<Follow[]>(`/community/users/${userId}/following`)
  }

  // =============== CONTESTS ===============

  /**
   * Get all contests
   */
  async getContests(params?: {
    status?: 'upcoming' | 'active' | 'ended'
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Contest>> {
    return await apiClient.get<PaginatedResponse<Contest>>('/community/contests', { params })
  }

  /**
   * Get a single contest by ID
   */
  async getContestById(id: string): Promise<Contest> {
    return await apiClient.get<Contest>(`/community/contests/${id}`)
  }

  /**
   * Submit entry to a contest
   */
  async submitContestEntry(contestId: string, data: {
    petId: string
    image: File
    caption?: string
  }): Promise<ContestEntry> {
    const formData = new FormData()
    formData.append('petId', data.petId)
    formData.append('image', data.image)
    if (data.caption) {
      formData.append('caption', data.caption)
    }

    return await apiClient.post<ContestEntry>(
      `/community/contests/${contestId}/entries`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  }

  /**
   * Vote for a contest entry
   */
  async voteContestEntry(entryId: string): Promise<{ voted: boolean; votesCount: number }> {
    return await apiClient.post(`/community/contest-entries/${entryId}/vote`)
  }

  /**
   * Get contest entries/leaderboard
   */
  async getContestEntries(contestId: string, params?: {
    page?: number
    limit?: number
    sortBy?: 'votes' | 'recent'
  }): Promise<PaginatedResponse<ContestEntry>> {
    return await apiClient.get<PaginatedResponse<ContestEntry>>(
      `/community/contests/${contestId}/entries`,
      { params }
    )
  }

  // =============== STATS ===============

  /**
   * Get community statistics
   */
  async getCommunityStats(): Promise<{
    members: number
    posts: number
    discussions: number
  }> {
    return await apiClient.get('/community/stats')
  }
}

export const communityService = new CommunityService()
export default communityService
