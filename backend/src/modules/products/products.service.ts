import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Remove images from DTO before creating product to prevent cascade with wrong field names
    const { images, ...productData } = createProductDto;

    const product = this.productRepository.create({
      ...productData,
      slug: this.generateSlug(createProductDto.name),
      sku: this.generateSku(),
    });

    const savedProduct = await this.productRepository.save(product);

    // Create product images if provided
    if (createProductDto.images && createProductDto.images.length > 0) {
      console.log('Processing images for new product:', savedProduct.id);
      console.log('Images received:', JSON.stringify(createProductDto.images, null, 2));

      const images = createProductDto.images
        .map((image: any, index: number) => {
          // Handle both string URLs and image objects (same as update method)
          const imageUrl = typeof image === 'string' ? image : (image.url || image.imageUrl);
          const altText = typeof image === 'string' ? savedProduct.name : (image.altText || savedProduct.name);
          const sortOrder = typeof image === 'string' ? index : (image.sortOrder ?? index);

          console.log(`Creating image entity ${index}:`, { imageUrl, altText, sortOrder, isPrimary: index === 0 });

          // Skip if no valid imageUrl
          if (!imageUrl) {
            console.warn(`Skipping image ${index}: no valid URL`);
            return null;
          }

          return this.productImageRepository.create({
            product: savedProduct,
            productId: savedProduct.id,
            imageUrl,
            altText,
            sortOrder,
            isPrimary: index === 0,
          });
        })
        .filter((img): img is ProductImage => img !== null);

      if (images.length > 0) {
        const savedImages = await this.productImageRepository.save(images);
        console.log('Saved images count:', savedImages.length);
      }
    }

    return this.findOne(savedProduct.id);
  }

  async findAll(filterDto: FilterProductDto) {
    const {
      page = 1,
      limit = 12,
      search,
      categoryId,
      minPrice,
      maxPrice,
      brand,
      inStock,
      isActive,
      status,
      lowStock,
      minStockQuantity,
      maxStockQuantity,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    // Convert to numbers in case they come as strings from query parameters
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 12;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.variants', 'variants');

    // Filter by status (map to isActive since DB only has isActive column)
    // active = isActive true, inactive/draft = isActive false
    if (status) {
      if (status === 'active') {
        queryBuilder.andWhere('product.isActive = :isActive', { isActive: true });
      } else if (status === 'inactive' || status === 'draft') {
        queryBuilder.andWhere('product.isActive = :isActive', { isActive: false });
      }
    }
    // Filter by isActive directly (backward compatibility)
    else if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.description LIKE :search OR product.brand LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (brand) {
      queryBuilder.andWhere('product.brand = :brand', { brand });
    }

    if (minPrice) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Stock filters
    if (inStock === true) {
      queryBuilder.andWhere('product.stockQuantity > 0');
    } else if (inStock === false) {
      queryBuilder.andWhere('product.stockQuantity = 0');
    }

    // Low stock filter (products with stock <= lowStockThreshold)
    if (lowStock === true) {
      queryBuilder.andWhere('product.stockQuantity <= product.lowStockThreshold');
      queryBuilder.andWhere('product.stockQuantity > 0');
    }

    // Stock quantity range filter
    if (minStockQuantity !== undefined && minStockQuantity !== null) {
      queryBuilder.andWhere('product.stockQuantity >= :minStockQuantity', { minStockQuantity });
    }
    if (maxStockQuantity !== undefined && maxStockQuantity !== null) {
      queryBuilder.andWhere('product.stockQuantity <= :maxStockQuantity', { maxStockQuantity });
    }

    const [products, total] = await queryBuilder
      .orderBy(`product.${sortBy}`, sortOrder)
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    return {
      data: products,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'images', 'variants', 'reviews', 'reviews.user'],
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['category', 'images', 'variants', 'reviews', 'reviews.user'],
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (updateProductDto.name && updateProductDto.name !== product.name) {
      updateProductDto.slug = this.generateSlug(updateProductDto.name);
    }

    // Explicitly handle categoryId to ensure the relation is updated
    if (updateProductDto.categoryId !== undefined) {
      product.categoryId = updateProductDto.categoryId;
    }

    // Handle image updates
    if (updateProductDto.images !== undefined && Array.isArray(updateProductDto.images)) {
      console.log('Processing images update for product:', id);
      console.log('Images received:', JSON.stringify(updateProductDto.images, null, 2));
      
      // Delete existing images completely
      await this.productImageRepository
        .createQueryBuilder()
        .delete()
        .from('product_images')
        .where('productId = :productId', { productId: id })
        .execute();
      console.log('Deleted existing images for product:', id);

      // Create new images
      if (updateProductDto.images.length > 0) {
        const imageEntities = updateProductDto.images.map((image, index) => {
          // Handle both string URLs and image objects
          const imageUrl = typeof image === 'string' ? image : image.url;
          const altText = typeof image === 'string' ? product.name : (image.altText || product.name);
          const sortOrder = typeof image === 'string' ? index : (image.sortOrder || index);

          console.log(`Creating image entity ${index}:`, { imageUrl, altText, sortOrder, isPrimary: index === 0 });

          return this.productImageRepository.create({
            imageUrl,
            altText,
            sortOrder,
            isPrimary: index === 0,
            productId: id,  // Explicitly set foreign key
            product: product,  // Set relation
          });
        });
        
        console.log('Image entities to save:', imageEntities.length);
        const savedImages = await this.productImageRepository.save(imageEntities);
        console.log('Saved images count:', savedImages.length);
        console.log('Saved images:', savedImages.map(img => ({ id: img.id, imageUrl: img.imageUrl })));
      } else {
        console.log('No images to save (empty array)');
      }
    } else {
      console.log('Images field not provided or invalid:', updateProductDto.images);
    }

    // Remove images from updateProductDto before saving product
    const { images, ...productUpdateData } = updateProductDto;
    
    Object.assign(product, productUpdateData);
    const savedProduct = await this.productRepository.save(product);

    // Return the product with populated relations
    const updatedProduct = await this.findOne(savedProduct.id);
    console.log('Final product images count:', updatedProduct.images?.length || 0);
    if (updatedProduct.images && updatedProduct.images.length > 0) {
      console.log('Final product images:', updatedProduct.images.map(img => ({ id: img.id, imageUrl: img.imageUrl })));
    }
    return updatedProduct;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);

    // Xoá = ẩn sản phẩm (ngừng bán) để an toàn, không làm mất dữ liệu/lịch sử
    // đơn hàng, đánh giá liên quan. Sản phẩm sẽ không hiển thị ngoài cửa hàng.
    product.isActive = false;
    await this.productRepository.save(product);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    product.stockQuantity = quantity;
    return this.productRepository.save(product);
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    // Convert to number in case it comes as string from query parameter
    const thresholdNum = Number(threshold) || 10;

    return this.productRepository
      .createQueryBuilder('product')
      .where('product.isActive = true')
      .andWhere('product.stockQuantity <= :threshold', { threshold: thresholdNum })
      .orderBy('product.stockQuantity', 'ASC')
      .getMany();
  }

  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = true')
      .andWhere('product.stockQuantity > 0')
      .orderBy('product.sortOrder', 'ASC')
      .addOrderBy('product.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getBestSellingProducts(limit: number = 8): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoin('product.orderItems', 'orderItems')
      .addSelect('SUM(orderItems.quantity)', 'totalSold')
      .where('product.isActive = true')
      .groupBy('product.id')
      .orderBy('totalSold', 'DESC')
      .limit(limit)
      .getMany();
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private generateSku(): string {
    return 'PC-' + Date.now().toString(36).toUpperCase();
  }
}