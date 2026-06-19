import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Reports')
@Controller('reports')
// Toàn bộ báo cáo/thống kê dashboard CHỈ dành cho ADMIN
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'], description: 'Group results by' })
  @ApiResponse({ status: 200, description: 'Revenue report retrieved successfully' })
  getRevenueReport(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.reportsService.getRevenueReport({ dateFrom, dateTo, groupBy });
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products report' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of products to return' })
  @ApiResponse({ status: 200, description: 'Top products report retrieved successfully' })
  getTopProductsReport(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getTopProductsReport({ dateFrom, dateTo, limit: limit ? Number(limit) : 10 });
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer analytics' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Customer analytics retrieved successfully' })
  getCustomerAnalytics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getCustomerAnalytics({ dateFrom, dateTo });
  }

  @Get('services')
  @ApiOperation({ summary: 'Get services performance report' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Services report retrieved successfully' })
  getServicesReport(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getServicesReport({ dateFrom, dateTo });
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get overview summary for a specific period' })
  @ApiQuery({ name: 'period', required: true, enum: ['week', 'month', 'quarter', 'year'], description: 'Time period' })
  @ApiResponse({ status: 200, description: 'Overview summary retrieved successfully' })
  getOverviewSummary(
    @Query('period') period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ) {
    return this.reportsService.getOverviewSummary(period);
  }
}
