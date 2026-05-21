import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { VNPayService } from '../payments/vnpay.service';
import { PaymentStatus } from '../../common/enums/appointment-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private vnpayService: VNPayService,
    private dataSource: DataSource,
  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async create(createOrderDto: any, userId?: string, ipAddr?: string) {
    const items: Array<{ productId: string; quantity: number; price: number; name?: string; imageUrl?: string }> =
      createOrderDto.items || [];

    if (!items.length) {
      throw new BadRequestException('Đơn hàng phải có ít nhất một sản phẩm.');
    }

    // Gom so luong theo productId de tranh truong hop client gui trung dong san pham
    const requestedQtyByProduct = new Map<string, number>();
    for (const it of items) {
      if (!it.productId) {
        throw new BadRequestException('Thiếu productId trong sản phẩm đặt hàng.');
      }
      if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
        throw new BadRequestException(
          `Số lượng đặt cho sản phẩm ${it.name || it.productId} không hợp lệ.`,
        );
      }
      requestedQtyByProduct.set(
        it.productId,
        (requestedQtyByProduct.get(it.productId) || 0) + it.quantity,
      );
    }

    // Tat ca thao tac (lock - validate - tru kho - tao don) trong 1 transaction
    const savedOrderId = await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);

      // Pessimistic write lock tat ca san pham trong gio hang
      // de tranh race condition: 2 user dat cung 1 SP, ca 2 cung pass validation
      const productIds = Array.from(requestedQtyByProduct.keys());
      const products = await productRepo
        .createQueryBuilder('p')
        .where('p.id IN (:...ids)', { ids: productIds })
        .setLock('pessimistic_write')
        .getMany();

      if (products.length !== productIds.length) {
        const foundIds = new Set(products.map((p) => p.id));
        const missing = productIds.filter((id) => !foundIds.has(id));
        throw new NotFoundException(`Không tìm thấy sản phẩm: ${missing.join(', ')}`);
      }

      // Validate stock tung san pham
      const outOfStock: string[] = [];
      for (const p of products) {
        const requested = requestedQtyByProduct.get(p.id)!;
        if (!p.isActive) {
          throw new BadRequestException(`Sản phẩm "${p.name}" đã ngừng kinh doanh.`);
        }
        if (p.stockQuantity < requested) {
          outOfStock.push(
            `"${p.name}" chỉ còn ${p.stockQuantity} sản phẩm, không đủ cho yêu cầu ${requested}.`,
          );
        }
      }
      if (outOfStock.length) {
        throw new BadRequestException(
          `Không đủ tồn kho: ${outOfStock.join(' ')}`,
        );
      }

      // Tru kho atomic
      for (const p of products) {
        const requested = requestedQtyByProduct.get(p.id)!;
        await productRepo.decrement({ id: p.id }, 'stockQuantity', requested);
      }

      // Generate unique order number
      const orderNumber = this.generateOrderNumber();

      // Calculate totals
      const subtotal =
        createOrderDto.subtotal ||
        items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const discountAmount = createOrderDto.discountAmount || 0;
      const shippingAmount = createOrderDto.shippingFee || 0;
      const totalAmount =
        createOrderDto.totalAmount || subtotal - discountAmount + shippingAmount;

      const shippingAddress = {
        name: createOrderDto.customerName || '',
        phone: createOrderDto.customerPhone || '',
        address: createOrderDto.shippingAddress || '',
        city: '',
        postalCode: '',
        country: 'Vietnam',
      };

      const paymentStatus =
        createOrderDto.paymentMethod === 'vnpay'
          ? PaymentStatus.PENDING
          : PaymentStatus.PENDING;

      const orderRepo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);

      const order = orderRepo.create({
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
      const savedOrder = await orderRepo.save(order);

      const orderItems = items.map((item) =>
        orderItemRepo.create({
          order: savedOrder,
          product: { id: item.productId },
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          productName: item.name || 'Sản phẩm',
          productSku: item.productId,
          productImage: item.imageUrl,
        }),
      );
      await orderItemRepo.save(orderItems);

      return savedOrder.id;
    });

    // VNPay url tao ben ngoai transaction vi day la call hoan toan local (khong DB)
    if (createOrderDto.paymentMethod === 'vnpay') {
      const order = await this.findOne(savedOrderId);
      const vnpayUrl = this.vnpayService.createPaymentUrl({
        orderId: savedOrderId,
        amount: Number(order!.totalAmount),
        orderInfo: `Thanh toan don hang ${order!.orderNumber}`,
        ipAddr: ipAddr || '127.0.0.1',
      });
      return { ...order, vnpayUrl };
    }

    return this.findOne(savedOrderId);
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