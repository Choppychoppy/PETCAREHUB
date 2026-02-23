import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Product } from '../products/entities/product.entity';
import { Service } from '../services/entities/service.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
  ) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total counts
    const [totalUsers, totalOrders, totalAppointments, totalProducts] = await Promise.all([
      this.userRepository.count({ where: { role: UserRole.USER } }),
      this.orderRepository.count(),
      this.appointmentRepository.count(),
      this.productRepository.count({ where: { isActive: true } }),
    ]);

    // Revenue calculation
    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.status != :status', { status: 'cancelled' })
      .getRawOne();
    const totalRevenue = parseFloat(revenueResult?.total || '0');

    // This month's stats
    const [thisMonthOrders, thisMonthRevenue, thisMonthUsers] = await Promise.all([
      this.orderRepository.count({
        where: {
          createdAt: MoreThanOrEqual(startOfMonth),
        },
      }),
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'total')
        .where('order.createdAt >= :start', { start: startOfMonth })
        .andWhere('order.status != :status', { status: 'cancelled' })
        .getRawOne(),
      this.userRepository.count({
        where: {
          role: UserRole.USER,
          createdAt: MoreThanOrEqual(startOfMonth),
        },
      }),
    ]);

    // Last month's stats for comparison
    const [lastMonthOrders, lastMonthRevenue] = await Promise.all([
      this.orderRepository.count({
        where: {
          createdAt: Between(startOfLastMonth, endOfLastMonth),
        },
      }),
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'total')
        .where('order.createdAt >= :start', { start: startOfLastMonth })
        .andWhere('order.createdAt <= :end', { end: endOfLastMonth })
        .andWhere('order.status != :status', { status: 'cancelled' })
        .getRawOne(),
    ]);

    // Recent orders (5 most recent)
    const recentOrders = await this.orderRepository.find({
      relations: ['user', 'user.profile', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Recent appointments (5 most recent)
    const recentAppointments = await this.appointmentRepository.find({
      relations: ['user', 'user.profile', 'service', 'pet'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Calculate trends
    const ordersTrend = lastMonthOrders > 0
      ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100)
      : 0;
    const revenueTrend = parseFloat(lastMonthRevenue?.total || '0') > 0
      ? Math.round(((parseFloat(thisMonthRevenue?.total || '0') - parseFloat(lastMonthRevenue?.total || '0')) / parseFloat(lastMonthRevenue?.total || '1')) * 100)
      : 0;

    return {
      totalUsers,
      totalOrders,
      totalAppointments,
      totalProducts,
      totalRevenue,
      thisMonth: {
        orders: thisMonthOrders,
        revenue: parseFloat(thisMonthRevenue?.total || '0'),
        newUsers: thisMonthUsers,
      },
      trends: {
        orders: ordersTrend,
        revenue: revenueTrend,
      },
      recentOrders,
      recentAppointments,
    };
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(params: {
    dateFrom?: string;
    dateTo?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const { dateFrom, dateTo, groupBy = 'day' } = params;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .select([
        groupBy === 'day'
          ? 'DATE(order.createdAt) as date'
          : groupBy === 'week'
          ? 'YEARWEEK(order.createdAt) as date'
          : 'DATE_FORMAT(order.createdAt, "%Y-%m") as date',
        'COUNT(order.id) as orderCount',
        'SUM(order.totalAmount) as revenue',
        'AVG(order.totalAmount) as averageOrderValue',
      ])
      .where('order.status != :status', { status: 'cancelled' });

    if (dateFrom) {
      queryBuilder.andWhere('order.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('order.createdAt <= :dateTo', { dateTo: endDate });
    }

    queryBuilder.groupBy('date').orderBy('date', 'ASC');

    const results = await queryBuilder.getRawMany();

    // Calculate totals
    const totals = results.reduce(
      (acc, row) => ({
        totalRevenue: acc.totalRevenue + parseFloat(row.revenue || '0'),
        totalOrders: acc.totalOrders + parseInt(row.orderCount || '0'),
      }),
      { totalRevenue: 0, totalOrders: 0 }
    );

    // Summary by period
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [weekSummary, monthSummary, quarterSummary] = await Promise.all([
      this.getRevenueSummary(weekAgo, now),
      this.getRevenueSummary(monthAgo, now),
      this.getRevenueSummary(quarterAgo, now),
    ]);

    return {
      data: results.map((row) => ({
        date: row.date,
        orderCount: parseInt(row.orderCount || '0'),
        revenue: parseFloat(row.revenue || '0'),
        averageOrderValue: parseFloat(row.averageOrderValue || '0'),
      })),
      totals,
      summary: {
        week: weekSummary,
        month: monthSummary,
        quarter: quarterSummary,
      },
    };
  }

  private async getRevenueSummary(from: Date, to: Date) {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'COUNT(order.id) as orderCount',
        'SUM(order.totalAmount) as revenue',
      ])
      .where('order.createdAt >= :from', { from })
      .andWhere('order.createdAt <= :to', { to })
      .andWhere('order.status != :status', { status: 'cancelled' })
      .getRawOne();

    return {
      orders: parseInt(result?.orderCount || '0'),
      revenue: parseFloat(result?.revenue || '0'),
    };
  }

  /**
   * Get top products report
   */
  async getTopProductsReport(params: {
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }) {
    const { dateFrom, dateTo, limit = 10 } = params;

    const queryBuilder = this.orderItemRepository
      .createQueryBuilder('item')
      .leftJoin('item.order', 'order')
      .leftJoin('item.product', 'product')
      .select([
        'product.id as productId',
        'item.productName as productName',
        'SUM(item.quantity) as totalSold',
        'SUM(item.totalPrice) as totalRevenue',
        'COUNT(DISTINCT order.id) as orderCount',
      ])
      .where('order.status != :status', { status: 'cancelled' });

    if (dateFrom) {
      queryBuilder.andWhere('order.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('order.createdAt <= :dateTo', { dateTo: endDate });
    }

    const results = await queryBuilder
      .groupBy('product.id')
      .addGroupBy('item.productName')
      .orderBy('totalRevenue', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((row, index) => ({
      rank: index + 1,
      productId: row.productId,
      name: row.productName,
      sold: parseInt(row.totalSold || '0'),
      revenue: parseFloat(row.totalRevenue || '0'),
      orderCount: parseInt(row.orderCount || '0'),
    }));
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(params?: { dateFrom?: string; dateTo?: string }) {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // New customers this month
    const newCustomers = await this.userRepository.count({
      where: {
        role: UserRole.USER,
        createdAt: MoreThanOrEqual(monthAgo),
      },
    });

    // Total customers
    const totalCustomers = await this.userRepository.count({
      where: { role: UserRole.USER },
    });

    // Customers with repeat orders (return rate)
    const repeatCustomers = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.userId')
      .groupBy('order.userId')
      .having('COUNT(order.id) > 1')
      .getCount();

    const returnRate = totalCustomers > 0
      ? Math.round((repeatCustomers / totalCustomers) * 100)
      : 0;

    // Top VIP customers
    const topCustomers = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.user', 'user')
      .leftJoin('user.profile', 'profile')
      .select([
        'user.id as userId',
        'user.email as email',
        'profile.name as name',
        'COUNT(order.id) as orderCount',
        'SUM(order.totalAmount) as totalSpent',
      ])
      .where('order.status != :status', { status: 'cancelled' })
      .groupBy('user.id')
      .addGroupBy('user.email')
      .addGroupBy('profile.name')
      .orderBy('totalSpent', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      newCustomers,
      totalCustomers,
      repeatCustomers,
      returnRate,
      topCustomers: topCustomers.map((c, index) => ({
        rank: index + 1,
        id: c.userId,
        name: c.name || c.email,
        email: c.email,
        orders: parseInt(c.orderCount || '0'),
        spent: parseFloat(c.totalSpent || '0'),
      })),
    };
  }

  /**
   * Get services performance report
   */
  async getServicesReport(params?: { dateFrom?: string; dateTo?: string }) {
    const { dateFrom, dateTo } = params || {};

    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('apt')
      .leftJoin('apt.service', 'service')
      .select([
        'service.id as serviceId',
        'service.name as serviceName',
        'service.price as price',
        'COUNT(apt.id) as totalAppointments',
        'SUM(CASE WHEN apt.status = :completed THEN 1 ELSE 0 END) as completedCount',
        'SUM(CASE WHEN apt.status = :cancelled THEN 1 ELSE 0 END) as cancelledCount',
      ])
      .setParameter('completed', 'completed')
      .setParameter('cancelled', 'cancelled');

    if (dateFrom) {
      queryBuilder.andWhere('apt.appointmentDate >= :dateFrom', { dateFrom: new Date(dateFrom) });
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('apt.appointmentDate <= :dateTo', { dateTo: endDate });
    }

    const results = await queryBuilder
      .groupBy('service.id')
      .addGroupBy('service.name')
      .addGroupBy('service.price')
      .orderBy('totalAppointments', 'DESC')
      .getRawMany();

    return results.map((row) => {
      const total = parseInt(row.totalAppointments || '0');
      const completed = parseInt(row.completedCount || '0');
      const price = parseFloat(row.price || '0');

      return {
        serviceId: row.serviceId,
        name: row.serviceName,
        appointments: total,
        completed,
        cancelled: parseInt(row.cancelledCount || '0'),
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        revenue: completed * price,
        rating: 4.5 + Math.random() * 0.5, // Placeholder - would need reviews table
      };
    });
  }

  /**
   * Get overview summary for specific period
   */
  async getOverviewSummary(period: 'week' | 'month' | 'quarter' | 'year') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const [ordersStats, appointmentsStats, newUsers] = await Promise.all([
      this.orderRepository
        .createQueryBuilder('order')
        .select([
          'COUNT(order.id) as count',
          'SUM(order.totalAmount) as revenue',
        ])
        .where('order.createdAt >= :start', { start: startDate })
        .andWhere('order.status != :status', { status: 'cancelled' })
        .getRawOne(),
      this.appointmentRepository
        .createQueryBuilder('apt')
        .select([
          'COUNT(apt.id) as total',
          'SUM(CASE WHEN apt.status = :completed THEN 1 ELSE 0 END) as completed',
        ])
        .setParameter('completed', 'completed')
        .where('apt.appointmentDate >= :start', { start: startDate })
        .getRawOne(),
      this.userRepository.count({
        where: {
          role: UserRole.USER,
          createdAt: MoreThanOrEqual(startDate),
        },
      }),
    ]);

    return {
      period,
      orders: parseInt(ordersStats?.count || '0'),
      revenue: parseFloat(ordersStats?.revenue || '0'),
      appointments: parseInt(appointmentsStats?.total || '0'),
      completedAppointments: parseInt(appointmentsStats?.completed || '0'),
      newUsers,
    };
  }
}
