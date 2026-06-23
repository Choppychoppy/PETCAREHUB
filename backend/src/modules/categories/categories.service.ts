import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/helpers/pagination.helper';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      // Check if parent exists
      if (createCategoryDto.parentId) {
        const parent = await this.categoryRepository.findOne({
          where: { id: createCategoryDto.parentId },
        });
        if (!parent) {
          throw new NotFoundException('Danh mục cha không tồn tại');
        }
      }

      // Check if category with same name already exists
      const existingCategory = await this.categoryRepository.findOne({
        where: { 
          name: createCategoryDto.name,
          type: createCategoryDto.type,
          isActive: true
        }
      });

      if (existingCategory) {
        throw new BadRequestException(`Danh mục "${createCategoryDto.name}" đã tồn tại trong loại ${this.getTypeName(createCategoryDto.type)}`);
      }

      const slug = this.generateSlug(createCategoryDto.name);
      
      // Check if slug already exists
      const existingSlug = await this.categoryRepository.findOne({
        where: { slug, isActive: true }
      });

      if (existingSlug) {
        throw new BadRequestException(`Tên danh mục này đã được sử dụng. Vui lòng chọn tên khác.`);
      }

      const category = this.categoryRepository.create({
        ...createCategoryDto,
        slug,
      });

      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle database constraint errors
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('IDX_420d9f679d41281f282f5bc7d0')) {
          throw new BadRequestException('Tên danh mục này đã được sử dụng. Vui lòng chọn tên khác.');
        }
        throw new BadRequestException('Dữ liệu đã tồn tại. Vui lòng kiểm tra lại.');
      }
      
      throw new BadRequestException('Có lỗi xảy ra khi tạo danh mục');
    }
  }

  async findAll(type?: string): Promise<PaginatedResult<Category>> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.children', 'children')
      .leftJoinAndSelect('category.parent', 'parent')
      .where('category.isActive = :isActive', { isActive: true });

    if (type) {
      queryBuilder.andWhere('category.type = :type', { type });
    }

    // Use default pagination when no specific pagination is requested
    const paginationDto: PaginationDto = {
      page: 1,
      limit: 100, // High limit for non-paginated requests
      sortBy: 'sortOrder',
      sortOrder: 'ASC'
    };

    return PaginationHelper.paginate(queryBuilder, paginationDto);
  }

  async findAllPaginated(paginationDto: PaginationDto, type?: string): Promise<PaginatedResult<Category>> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.children', 'children')
      .leftJoinAndSelect('category.parent', 'parent')
      .where('category.isActive = :isActive', { isActive: true });

    if (type) {
      queryBuilder.andWhere('category.type = :type', { type });
    }

    // Apply search filter
    PaginationHelper.applySearch(
      queryBuilder, 
      ['name', 'description'], 
      paginationDto.search
    );

    // Apply status filter if provided
    PaginationHelper.applyStatusFilter(
      queryBuilder,
      paginationDto.status,
      'isActive'
    );

    return PaginationHelper.paginate(queryBuilder, paginationDto);
  }

  async findTree(type?: string): Promise<Category[]> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.children', 'children')
      .where('category.isActive = :isActive', { isActive: true })
      .andWhere('category.parent IS NULL'); // Only root categories

    if (type) {
      queryBuilder.andWhere('category.type = :type', { type });
    }

    const rootCategories = await queryBuilder
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .getMany();

    // Load all children recursively
    for (const category of rootCategories) {
      await this.loadChildren(category);
    }

    return rootCategories;
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'services', 'products'],
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
      relations: ['parent', 'children', 'services', 'products'],
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    try {
      const category = await this.findOne(id);

      // Check for circular reference if updating parent
      if (updateCategoryDto.parentId && updateCategoryDto.parentId !== category.parent?.id) {
        const isCircular = await this.checkCircularReference(id, updateCategoryDto.parentId);
        if (isCircular) {
          throw new BadRequestException('Không thể đặt danh mục cha vì sẽ tạo ra chu trình tham chiếu');
        }
      }

      // If name is being updated, check for duplicates
      if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
        const existingCategory = await this.categoryRepository.findOne({
          where: { 
            name: updateCategoryDto.name,
            type: updateCategoryDto.type || category.type,
            isActive: true,
            id: Not(id) // Exclude current category
          }
        });

        if (existingCategory) {
          throw new BadRequestException(`Danh mục "${updateCategoryDto.name}" đã tồn tại trong loại ${this.getTypeName(updateCategoryDto.type || category.type)}`);
        }

        const slug = this.generateSlug(updateCategoryDto.name);
        
        // Check if slug already exists
        const existingSlug = await this.categoryRepository.findOne({
          where: { 
            slug,
            isActive: true,
            id: Not(id) // Exclude current category
          }
        });

        if (existingSlug) {
          throw new BadRequestException(`Tên danh mục này đã được sử dụng. Vui lòng chọn tên khác.`);
        }

        updateCategoryDto.slug = slug;
      }

      Object.assign(category, updateCategoryDto);
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle database constraint errors
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('IDX_420d9f679d41281f282f5bc7d0')) {
          throw new BadRequestException('Tên danh mục này đã được sử dụng. Vui lòng chọn tên khác.');
        }
        throw new BadRequestException('Dữ liệu đã tồn tại. Vui lòng kiểm tra lại.');
      }
      
      throw new BadRequestException('Có lỗi xảy ra khi cập nhật danh mục');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const category = await this.findOne(id);
      
      // Check if category has children
      const childrenCount = await this.categoryRepository.count({
        where: { parent: { id }, isActive: true }
      });

      if (childrenCount > 0) {
        throw new BadRequestException(`Không thể xóa danh mục này vì còn ${childrenCount} danh mục con. Vui lòng xóa các danh mục con trước.`);
      }

      // Check if category has associated services or products
      if ((category.services && category.services.length > 0) || 
          (category.products && category.products.length > 0)) {
        throw new BadRequestException('Không thể xóa danh mục này vì đang được sử dụng bởi sản phẩm hoặc dịch vụ.');
      }

      // Soft delete
      category.isActive = false;
      await this.categoryRepository.save(category);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle foreign key constraint errors
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new BadRequestException('Không thể xóa danh mục này vì đang được sử dụng bởi dữ liệu khác.');
      }
      
      throw new BadRequestException('Có lỗi xảy ra khi xóa danh mục');
    }
  }

  private async loadChildren(category: Category): Promise<void> {
    const children = await this.categoryRepository.find({
      where: { parent: { id: category.id }, isActive: true },
      relations: ['children'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    category.children = children;

    for (const child of children) {
      await this.loadChildren(child);
    }
  }

  private async checkCircularReference(categoryId: string, parentId: string): Promise<boolean> {
    if (categoryId === parentId) {
      return true;
    }

    const parent = await this.categoryRepository.findOne({
      where: { id: parentId },
      relations: ['parent'],
    });

    if (!parent) {
      return false;
    }

    if (parent.parent) {
      return this.checkCircularReference(categoryId, parent.parent.id);
    }

    return false;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private getTypeName(type: string): string {
    switch (type) {
      case 'service': return 'Dịch vụ';
      case 'product': return 'Sản phẩm';
      case 'pet': return 'Thú cưng';
      default: return type;
    }
  }
}