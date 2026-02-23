import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AppointmentStatus, OrderStatus } from '../../common/enums/appointment-status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Consultation } from '../consultation/entities/consultation.entity';
import { SupportTicket } from '../support/entities/support-ticket.entity';
import { Order } from '../orders/entities/order.entity';
import { Post } from '../community/entities/post.entity';
import { Comment } from '../community/entities/comment.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Consultation)
    private consultationRepository: Repository<Consultation>,
    @InjectRepository(SupportTicket)
    private supportTicketRepository: Repository<SupportTicket>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async getStaffDashboard(staffId: string) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      todayAppointments,
      assignedTickets,
      activeConsultations,
      pendingOrders,
      recentActivity,
    ] = await Promise.all([
      this.appointmentRepository.count({
        where: {
          staffId,
          appointmentDate: Between(startOfDay, endOfDay),
        },
      }),
      this.supportTicketRepository.count({
        where: { assignedToId: staffId, status: 'in_progress' },
      }),
      this.consultationRepository.count({
        where: { vetId: staffId, status: 'active' },
      }),
      this.orderRepository.count({
        where: { status: OrderStatus.PROCESSING },
      }),
      this.appointmentRepository.find({
        where: { staffId },
        order: { updatedAt: 'DESC' },
        take: 5,
        relations: ['user', 'user.profile', 'pet'],
      }),
    ]);

    return {
      stats: {
        todayAppointments,
        assignedTickets,
        activeConsultations,
        pendingOrders,
      },
      recentActivity,
    };
  }

  async getStaffAppointments(staffId: string, page: number, limit: number, filters: any) {
    const queryBuilder = this.appointmentRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('appointment.service', 'service')
      .where('appointment.staffId = :staffId', { staffId })
      .orderBy('appointment.appointmentDate', 'ASC');

    if (filters.status) {
      queryBuilder.andWhere('appointment.status = :status', { status: filters.status });
    }

    if (filters.date) {
      const date = new Date(filters.date);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      queryBuilder.andWhere('appointment.appointmentDate BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [appointments, total] = await queryBuilder.getManyAndCount();

    return {
      data: appointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTodayAppointments(staffId: string) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return this.appointmentRepository.find({
      where: {
        staffId,
        appointmentDate: Between(startOfDay, endOfDay),
      },
      relations: ['user', 'user.profile', 'pet', 'service'],
      order: { appointmentDate: 'ASC' },
    });
  }

  async updateAppointmentStatus(appointmentId: string, staffId: string, status: string, notes?: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, staffId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found or not assigned to you');
    }

    const updateData: any = { status };
    if (notes) updateData.notes = notes;

    await this.appointmentRepository.update(appointmentId, updateData);

    return { message: 'Appointment status updated successfully' };
  }

  async completeAppointment(appointmentId: string, staffId: string, completionData: any) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, staffId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found or not assigned to you');
    }

    await this.appointmentRepository.update(appointmentId, {
      status: AppointmentStatus.COMPLETED,
      diagnosis: completionData.diagnosis,
      treatment: completionData.treatment,
      prescription: completionData.prescription,
      followUpDate: completionData.followUpDate,
      notes: completionData.notes,
      completedAt: new Date(),
    });

    return { message: 'Appointment completed successfully' };
  }

  async getAssignedConsultations(staffId: string, page: number, limit: number, status?: string) {
    const queryBuilder = this.consultationRepository.createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('consultation.pet', 'pet')
      .leftJoinAndSelect('consultation.messages', 'messages')
      .where('consultation.vetId = :staffId', { staffId })
      .orderBy('consultation.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('consultation.status = :status', { status });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [consultations, total] = await queryBuilder.getManyAndCount();

    return {
      data: consultations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAvailableConsultations(page: number, limit: number) {
    const queryBuilder = this.consultationRepository.createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('consultation.pet', 'pet')
      .where('consultation.vetId IS NULL')
      .andWhere('consultation.status = :status', { status: 'scheduled' })
      .orderBy('consultation.createdAt', 'ASC');

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [consultations, total] = await queryBuilder.getManyAndCount();

    return {
      data: consultations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async claimConsultation(consultationId: string, staffId: string) {
    const consultation = await this.consultationRepository.findOne({
      where: { id: consultationId, vetId: null, status: 'scheduled' },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not available for claim');
    }

    await this.consultationRepository.update(consultationId, {
      vetId: staffId,
      status: 'active',
      startedAt: new Date(),
    });

    return { message: 'Consultation claimed successfully' };
  }

  async getAssignedTickets(staffId: string, page: number, limit: number, filters: any) {
    const queryBuilder = this.supportTicketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('ticket.messages', 'messages')
      .where('ticket.assignedToId = :staffId', { staffId })
      .orderBy('ticket.createdAt', 'DESC');

    if (filters.status) {
      queryBuilder.andWhere('ticket.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      queryBuilder.andWhere('ticket.priority = :priority', { priority: filters.priority });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [tickets, total] = await queryBuilder.getManyAndCount();

    return {
      data: tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnassignedTickets(page: number, limit: number, priority?: string) {
    const queryBuilder = this.supportTicketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('ticket.assignedToId IS NULL')
      .andWhere('ticket.status = :status', { status: 'open' })
      .orderBy('ticket.priority', 'DESC')
      .addOrderBy('ticket.createdAt', 'ASC');

    if (priority) {
      queryBuilder.andWhere('ticket.priority = :priority', { priority });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [tickets, total] = await queryBuilder.getManyAndCount();

    return {
      data: tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async assignTicketToSelf(ticketId: string, staffId: string) {
    const ticket = await this.supportTicketRepository.findOne({
      where: { id: ticketId, assignedToId: null },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not available for assignment');
    }

    await this.supportTicketRepository.update(ticketId, {
      assignedToId: staffId,
      status: 'in_progress',
    });

    return { message: 'Ticket assigned to you successfully' };
  }

  async getPendingOrders(page: number, limit: number) {
    const queryBuilder = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .where('order.status IN (:...statuses)', { statuses: ['pending', 'confirmed'] })
      .orderBy('order.createdAt', 'ASC');

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async processOrder(orderId: string, staffId: string, notes?: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, status: OrderStatus.PENDING },
    });

    if (!order) {
      throw new NotFoundException('Order not found or already processed');
    }

    const updateData: any = { status: 'processing', processedBy: staffId, processedAt: new Date() };
    if (notes) updateData.processingNotes = notes;

    await this.orderRepository.update(orderId, updateData);

    return { message: 'Order processed successfully' };
  }

  async shipOrder(orderId: string, staffId: string, shippingData: any) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, status: OrderStatus.PROCESSING },
    });

    if (!order) {
      throw new NotFoundException('Order not found or not ready for shipping');
    }

    await this.orderRepository.update(orderId, {
      status: OrderStatus.SHIPPED,
      trackingNumber: shippingData.trackingNumber,
      carrier: shippingData.carrier,
      shippedBy: staffId,
      shippedAt: new Date(),
      shippingNotes: shippingData.notes,
    });

    return { message: 'Order marked as shipped successfully' };
  }

  async getStaffSchedule(staffId: string, startDate: string, endDate: string) {
    return this.appointmentRepository.find({
      where: {
        staffId,
        appointmentDate: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['user', 'user.profile', 'pet', 'service'],
      order: { appointmentDate: 'ASC' },
    });
  }

  async setAvailability(staffId: string, availabilityData: any) {
    return {
      message: 'Availability updated successfully',
      data: availabilityData,
      staffId,
    };
  }

  async getPerformanceMetrics(staffId: string, startDate?: string, endDate?: string) {
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { createdAt: Between(new Date(startDate), new Date(endDate)) };
    }

    const [
      completedAppointments,
      resolvedTickets,
      completedConsultations,
      averageRating,
    ] = await Promise.all([
      this.appointmentRepository.count({
        where: { staffId, status: AppointmentStatus.COMPLETED, ...dateFilter },
      }),
      this.supportTicketRepository.count({
        where: { assignedToId: staffId, status: 'resolved', ...dateFilter },
      }),
      this.consultationRepository.count({
        where: { vetId: staffId, status: 'completed', ...dateFilter },
      }),
      // This would need a proper rating system implementation
      4.5, // Mock average rating
    ]);

    return {
      completedAppointments,
      resolvedTickets,
      completedConsultations,
      averageRating,
      period: { startDate, endDate },
    };
  }

  async getFlaggedContent(page: number, limit: number, type?: string) {
    let queryBuilder;
    
    if (!type || type === 'posts') {
      queryBuilder = this.postRepository.createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('author.profile', 'profile')
        .where('post.flagged = :flagged', { flagged: true })
        .orWhere('post.status = :status', { status: 'pending_review' });
    }

    if (!queryBuilder) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    queryBuilder
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [content, total] = await queryBuilder.getManyAndCount();

    return {
      data: content,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async reviewContent(type: string, contentId: string, staffId: string, reviewData: any) {
    let repository;
    
    switch (type) {
      case 'post':
        repository = this.postRepository;
        break;
      case 'comment':
        repository = this.commentRepository;
        break;
      default:
        throw new NotFoundException('Invalid content type');
    }

    const content = await repository.findOne({ where: { id: contentId } });
    
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const updateData: any = {
      reviewedBy: staffId,
      reviewedAt: new Date(),
      reviewAction: reviewData.action,
      reviewReason: reviewData.reason,
      reviewNotes: reviewData.notes,
    };

    if (reviewData.action === 'approve') {
      updateData.status = 'published';
      updateData.flagged = false;
    } else if (reviewData.action === 'reject') {
      updateData.status = 'draft';
      updateData.flagged = false;
    } else if (reviewData.action === 'remove') {
      updateData.status = 'removed';
    }

    await repository.update(contentId, updateData);

    return { message: `Content ${reviewData.action}ed successfully` };
  }
}