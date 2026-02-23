import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DiscountCodesService } from './discount-codes.service';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { UpdateDiscountCodeDto } from './dto/update-discount-code.dto';
import { FilterDiscountCodeDto } from './dto/filter-discount-code.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Discount Codes')
@Controller('discount-codes')
export class DiscountCodesController {
  constructor(private readonly discountCodesService: DiscountCodesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create discount code (Admin/Staff only)' })
  @ApiResponse({ status: 201, description: 'Discount code created successfully' })
  @ApiResponse({ status: 409, description: 'Discount code already exists' })
  create(@Body() createDiscountCodeDto: CreateDiscountCodeDto) {
    return this.discountCodesService.create(createDiscountCodeDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all discount codes with filters (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Discount codes retrieved successfully' })
  findAll(@Query() filterDto: FilterDiscountCodeDto) {
    return this.discountCodesService.findAll(filterDto);
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate discount code' })
  @ApiResponse({ status: 200, description: 'Discount code is valid' })
  @ApiResponse({ status: 404, description: 'Discount code not found or invalid' })
  validateCode(@Param('code') code: string) {
    return this.discountCodesService.findByCode(code);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get discount code by ID (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Discount code retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Discount code not found' })
  findOne(@Param('id') id: string) {
    return this.discountCodesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update discount code (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Discount code updated successfully' })
  @ApiResponse({ status: 404, description: 'Discount code not found' })
  @ApiResponse({ status: 409, description: 'Discount code already exists' })
  update(@Param('id') id: string, @Body() updateDiscountCodeDto: UpdateDiscountCodeDto) {
    return this.discountCodesService.update(id, updateDiscountCodeDto);
  }

  @Put(':id/toggle-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle discount code status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Discount code status updated' })
  toggleStatus(@Param('id') id: string) {
    return this.discountCodesService.toggleStatus(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete discount code (Admin only)' })
  @ApiResponse({ status: 200, description: 'Discount code deleted successfully' })
  @ApiResponse({ status: 404, description: 'Discount code not found' })
  async remove(@Param('id') id: string) {
    await this.discountCodesService.remove(id);
    return { message: 'Mã giảm giá đã được xóa thành công' };
  }
}