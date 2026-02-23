import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { VNPayService } from '../payments/vnpay.service';
import { PaymentStatus } from '../../common/enums/appointment-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private vnpayService: VNPayService,
  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async create(createOrderDto: any, userId?: string, ipAddr?: string) {
    // Generate unique order number
    const orderNumber = this.generateOrderNumber();

    // Calculate totals
    const subtotal = createOrderDto.subtotal ||
      (createOrderDto.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0);
    const discountAmount = createOrderDto.discountAmount || 0;
    const shippingAmount = createOrderDto.shippingFee || 0;
    const totalAmount = createOrderDto.totalAmount || (subtotal - discountAmount + shippingAmount);

    // Build shipping address
    const shippingAddress = {
      name: createOrderDto.customerName || '',
      phone: createOrderDto.customerPhone || '',
      address: createOrderDto.shippingAddress || '',
      city: '',
      postalCode: '',
      country: 'Vietnam'
    };

    // Determine payment status based on payment method
    const paymentStatus = createOrderDto.paymentMethod === 'vnpay'
      ? PaymentStatus.PENDING
      : PaymentStatus.PENDING;

    // Create order
    const order = this.orderRepository.create({
      orderNumber,
      subtotal,
      discountAmount,
      shippingAmount,
      totalAmount,
      paymentMethod: createOrderDto.paymentMethod || 'cod',
      paymentStatus,
      shippingAddress,
      notes: createOrderDto.notes,
      user: userId ? { id: userId } : undefined,
    });

    // Save order first
    const savedOrder = await this.orderRepository.save(order);

    // Create order items
    if (createOrderDto.items && createOrderDto.items.length > 0) {
      const orderItems = createOrderDto.items.map((item: any) =>
        this.orderItemRepository.create({
          order: savedOrder,
          product: { id: item.productId },
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          productName: item.name || 'Sản phẩm',
          productSku: item.productId,
          productImage: item.imageUrl,
        })
      );

      await this.orderItemRepository.save(orderItems);
    }

    // If VNPay payment, generate payment URL
    if (createOrderDto.paymentMethod === 'vnpay') {
      const vnpayUrl = this.vnpayService.createPaymentUrl({
        orderId: savedOrder.id,
        amount: totalAmount,
        orderInfo: `Thanh toan don hang ${orderNumber}`,
        ipAddr: ipAddr || '127.0.0.1',
      });

      return {
        ...await this.findOne(savedOrder.id),
        vnpayUrl,
      };
    }

    // Return order with items
    return this.findOne(savedOrder.id);
  }

  /**
   * Handle VNPay return callback
   */
  async handleVNPayReturn(vnpParams: Record<string, string>) {
    const result = this.vnpayService.verifyReturnUrl(vnpParams);

    if (!result.isValid) {
      return {
        success: false,
        message: 'Chữ ký không hợp lệ',
      };
    }

    const order = await this.findOne(result.orderId);
    if (!order) {
      return {
        success: false,
        message: 'Không tìm thấy đơn hàng',
      };
    }

    // Update payment status based on VNPay response
    if (result.responseCode === '00') {
      await this.orderRepository.update(result.orderId, {
        paymentStatus: PaymentStatus.PAID,
        paymentTransactionId: result.transactionNo,
      });

      return {
        success: true,
        message: result.message,
        orderId: result.orderId,
        amount: result.amount,
        transactionNo: result.transactionNo,
      };
    } else {
      await this.orderRepository.update(result.orderId, {
        paymentStatus: PaymentStatus.FAILED,
      });

      return {
        success: false,
        message: result.message,
        orderId: result.orderId,
        responseCode: result.responseCode,
      };
    }
  }

  async findAll(page: number = 1, limit: number = 10, filters?: {
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    // Convert to numbers in case they come as strings from query parameters
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.images', 'images');

    // Filter by status
    if (filters?.status && filters.status !== 'all') {
      queryBuilder.andWhere('order.status = :status', { status: filters.status });
    }

    // Search by order number, customer name, or email
    if (filters?.search) {
      queryBuilder.andWhere(
        '(order.orderNumber LIKE :search OR user.email LIKE :search OR profile.name LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Filter by date range
    if (filters?.dateFrom) {
      queryBuilder.andWhere('order.createdAt >= :dateFrom', {
        dateFrom: new Date(filters.dateFrom)
      });
    }

    if (filters?.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('order.createdAt <= :dateTo', { dateTo });
    }

    const [orders, total] = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: orders,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  }

  async findOne(id: string) {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'user.profile', 'items', 'items.product', 'items.product.images']
    });
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10, status?: string) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    // Build where condition
    const whereCondition: any = { user: { id: userId } };
    if (status && status !== 'all') {
      whereCondition.status = status;
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where: whereCondition,
      relations: ['items', 'items.product', 'items.product.images'],
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: orders,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  }

  async update(id: string, updateOrderDto: any) {
    await this.orderRepository.update(id, updateOrderDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    return this.orderRepository.delete(id);
  }
}