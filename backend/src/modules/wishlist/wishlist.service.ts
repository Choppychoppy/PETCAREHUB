import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { Product } from '../products/entities/product.entity';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async addToWishlist(userId: string, addToWishlistDto: AddToWishlistDto) {
    const { productId } = addToWishlistDto;

    const product = await this.productRepository.findOne({ 
      where: { id: productId } 
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const existingWishlistItem = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (existingWishlistItem) {
      throw new ConflictException('Sản phẩm đã có trong danh sách yêu thích');
    }

    const wishlistItem = this.wishlistRepository.create({
      userId,
      productId,
    });

    await this.wishlistRepository.save(wishlistItem);

    return this.wishlistRepository.findOne({
      where: { id: wishlistItem.id },
      relations: ['product', 'product.images', 'product.variants'],
    });
  }

  async removeFromWishlist(userId: string, productId: string) {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong danh sách yêu thích');
    }

    await this.wishlistRepository.remove(wishlistItem);

    return { message: 'Product removed from wishlist successfully' };
  }

  async getUserWishlist(userId: string, page: number = 1, limit: number = 20) {
    const [wishlistItems, total] = await this.wishlistRepository.findAndCount({
      where: { userId },
      relations: [
        'product', 
        'product.images', 
        'product.variants', 
        'product.category',
        'product.reviews',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = wishlistItems.map(item => ({
      id: item.id,
      addedAt: item.createdAt,
      product: {
        ...item.product,
        averageRating: item.product.reviews?.length > 0 
          ? item.product.reviews.reduce((sum, review) => sum + review.rating, 0) / item.product.reviews.length 
          : 0,
        reviewCount: item.product.reviews?.length || 0,
      },
    }));

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async isInWishlist(userId: string, productId: string) {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    return { isInWishlist: !!wishlistItem };
  }

  async clearWishlist(userId: string) {
    await this.wishlistRepository.delete({ userId });

    return { message: 'Wishlist cleared successfully' };
  }

  async getWishlistCount(userId: string) {
    const count = await this.wishlistRepository.count({
      where: { userId },
    });

    return { count };
  }

  async moveToCart(userId: string, productId: string) {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: { userId, productId },
      relations: ['product'],
    });

    if (!wishlistItem) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong danh sách yêu thích');
    }

    await this.wishlistRepository.remove(wishlistItem);

    return { 
      message: 'Product moved to cart successfully',
      product: wishlistItem.product,
    };
  }

  async getWishlistStats() {
    const totalItems = await this.wishlistRepository.count();
    
    const mostWishlisted = await this.wishlistRepository
      .createQueryBuilder('wishlist')
      .leftJoinAndSelect('wishlist.product', 'product')
      .leftJoinAndSelect('product.images', 'images')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('product.price', 'price')
      .addSelect('COUNT(wishlist.id)', 'wishlistCount')
      .groupBy('product.id')
      .orderBy('wishlistCount', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalItems,
      mostWishlisted,
    };
  }
}