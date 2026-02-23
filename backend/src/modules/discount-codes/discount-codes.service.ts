import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscountCode, DiscountStatus } from './entities/discount-code.entity';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { UpdateDiscountCodeDto } from './dto/update-discount-code.dto';
import { FilterDiscountCodeDto } from './dto/filter-discount-code.dto';

@Injectable()
export class DiscountCodesService {
  constructor(
    @InjectRepository(DiscountCode)
    private discountCodeRepository: Repository<DiscountCode>,
  ) {}

  async create(createDiscountCodeDto: CreateDiscountCodeDto): Promise<DiscountCode> {
    // Check if code already exists
    const existingCode = await this.discountCodeRepository.findOne({
      where: { code: createDiscountCodeDto.code }
    });

    if (existingCode) {
      throw new ConflictException('Mã giảm giá đã tồn tại');
    }

    const discountCode = this.discountCodeRepository.create({
      ...createDiscountCodeDto,
      validFrom: new Date(createDiscountCodeDto.validFrom),
      validTo: new Date(createDiscountCodeDto.validTo),
    });

    return await this.discountCodeRepository.save(discountCode);
  }

  async findAll(filterDto: FilterDiscountCodeDto) {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
    } = filterDto;

    const queryBuilder = this.discountCodeRepository
      .createQueryBuilder('discount');

    if (search) {
      queryBuilder.andWhere(
        '(discount.code LIKE :search OR discount.name LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type) {
      queryBuilder.andWhere('discount.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('discount.status = :status', { status });
    }

    const [discountCodes, total] = await queryBuilder
      .orderBy('discount.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    
    return {
      data: discountCodes,
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

  async findOne(id: string): Promise<DiscountCode> {
    const discountCode = await this.discountCodeRepository.findOne({
      where: { id }
    });

    if (!discountCode) {
      throw new NotFoundException('Không tìm thấy mã giảm giá');
    }

    return discountCode;
  }

  async findByCode(code: string): Promise<DiscountCode> {
    // Find discount code by code (case-insensitive)
    const discountCode = await this.discountCodeRepository.findOne({
      where: { code: code.toUpperCase() }
    });

    if (!discountCode) {
      throw new NotFoundException('Mã giảm giá không tồn tại');
    }

    // Check status
    if (discountCode.status === DiscountStatus.INACTIVE) {
      throw new NotFoundException('Mã giảm giá đã bị vô hiệu hóa');
    }

    if (discountCode.status === DiscountStatus.EXPIRED) {
      throw new NotFoundException('Mã giảm giá đã hết hạn');
    }

    // Check if discount is within valid date range
    const now = new Date();
    const validFrom = new Date(discountCode.validFrom);
    const validTo = new Date(discountCode.validTo);

    if (now < validFrom) {
      throw new NotFoundException(`Mã giảm giá chưa có hiệu lực. Bắt đầu từ ${validFrom.toLocaleDateString('vi-VN')}`);
    }

    if (now > validTo) {
      throw new NotFoundException('Mã giảm giá đã hết hạn sử dụng');
    }

    // Check usage limit
    if (discountCode.usageLimit && discountCode.usedCount >= discountCode.usageLimit) {
      throw new NotFoundException('Mã giảm giá đã hết lượt sử dụng');
    }

    return discountCode;
  }

  async update(id: string, updateDiscountCodeDto: UpdateDiscountCodeDto): Promise<DiscountCode> {
    const discountCode = await this.findOne(id);

    // Check if code already exists (if code is being updated)
    if (updateDiscountCodeDto.code && updateDiscountCodeDto.code !== discountCode.code) {
      const existingCode = await this.discountCodeRepository.findOne({
        where: { code: updateDiscountCodeDto.code }
      });

      if (existingCode) {
        throw new ConflictException('Mã giảm giá đã tồn tại');
      }
    }

    const updateData = { ...updateDiscountCodeDto };
    if (updateDiscountCodeDto.validFrom) {
      updateData.validFrom = new Date(updateDiscountCodeDto.validFrom) as any;
    }
    if (updateDiscountCodeDto.validTo) {
      updateData.validTo = new Date(updateDiscountCodeDto.validTo) as any;
    }

    Object.assign(discountCode, updateData);
    await this.discountCodeRepository.save(discountCode);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const discountCode = await this.findOne(id);
    await this.discountCodeRepository.remove(discountCode);
  }

  async toggleStatus(id: string): Promise<DiscountCode> {
    const discountCode = await this.findOne(id);
    
    discountCode.status = discountCode.status === DiscountStatus.ACTIVE 
      ? DiscountStatus.INACTIVE 
      : DiscountStatus.ACTIVE;

    await this.discountCodeRepository.save(discountCode);
    return this.findOne(id);
  }

  async incrementUsage(code: string): Promise<void> {
    await this.discountCodeRepository.update(
      { code },
      { usedCount: () => 'usedCount + 1' }
    );
  }
}