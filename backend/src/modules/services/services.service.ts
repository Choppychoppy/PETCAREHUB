import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FilterServiceDto } from './dto/filter-service.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/helpers/pagination.helper';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const service = this.serviceRepository.create({
      ...createServiceDto,
      slug: this.generateSlug(createServiceDto.name),
    });
    return this.serviceRepository.save(service);
  }

  async findAll(filterDto: FilterServiceDto): Promise<PaginatedResult<Service>> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      petType,
      minPrice,
      maxPrice,
      isActive = true,
    } = filterDto;

    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('service.reviews', 'reviews')
      .where('service.isActive = :isActive', { isActive });

    // Apply search using helper
    PaginationHelper.applySearch(
      queryBuilder,
      ['name', 'description'],
      search
    );

    if (categoryId) {
      queryBuilder.andWhere('service.categoryId = :categoryId', { categoryId });
    }

    if (petType) {
      // petTypes lưu dạng JSON array (vd: ["Chó","Mèo"]). JSON_CONTAINS cần giá trị
      // scalar JSON ("Chó") chứ không phải mảng (["Chó"]) thì mới khớp đúng phần tử.
      queryBuilder.andWhere('JSON_CONTAINS(service.petTypes, :petType)', {
        petType: JSON.stringify(petType),
      });
    }

    if (minPrice) {
      queryBuilder.andWhere('service.price >= :minPrice', { minPrice });
    }

    if (maxPrice) {
      queryBuilder.andWhere('service.price <= :maxPrice', { maxPrice });
    }

    // Use pagination helper with custom sorting
    const paginationDto: PaginationDto = {
      page,
      limit,
      search,
      sortBy: 'sortOrder',
      sortOrder: 'ASC'
    };

    return PaginationHelper.paginate(queryBuilder, paginationDto);
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['category', 'reviews', 'reviews.user'],
    });

    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ');
    }

    return service;
  }

  async findBySlug(slug: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { slug },
      relations: ['category', 'reviews', 'reviews.user'],
    });

    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ');
    }

    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);

    if (updateServiceDto.name && updateServiceDto.name !== service.name) {
      updateServiceDto.slug = this.generateSlug(updateServiceDto.name);
    }

    Object.assign(service, updateServiceDto);
    return this.serviceRepository.save(service);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);
    service.isActive = false;
    await this.serviceRepository.save(service);
  }

  async getPopularServices(limit: number = 5): Promise<Service[]> {
    return this.serviceRepository
      .createQueryBuilder('service')
      .leftJoin('service.appointments', 'appointments')
      .addSelect('COUNT(appointments.id)', 'appointmentCount')
      .where('service.isActive = true')
      .groupBy('service.id')
      .orderBy('appointmentCount', 'DESC')
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
}