import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportMessage } from './entities/support-message.entity';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { CreatePublicContactDto } from './dto/create-public-contact.dto';
import { EmailService } from '../../common/services/email.service';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private supportTicketRepository: Repository<SupportTicket>,
    @InjectRepository(SupportMessage)
    private supportMessageRepository: Repository<SupportMessage>,
    private emailService: EmailService,
  ) {}

  // Public contact form submission (no auth required)
  async createPublicContact(createPublicContactDto: CreatePublicContactDto) {
    // Map urgency to priority
    const priorityMap = {
      'low': 'low',
      'normal': 'medium',
      'high': 'high',
      'urgent': 'urgent',
    };

    const ticket = this.supportTicketRepository.create({
      title: createPublicContactDto.subject,
      description: createPublicContactDto.message,
      priority: priorityMap[createPublicContactDto.urgency || 'normal'] || 'medium',
      category: 'general',
      guestName: createPublicContactDto.name,
      guestEmail: createPublicContactDto.email,
      guestPhone: createPublicContactDto.phone || null,
      petType: createPublicContactDto.petType || null,
      userId: null, // Guest ticket - no user ID
    });

    const savedTicket = await this.supportTicketRepository.save(ticket);

    // Create system message
    const systemMessage = this.supportMessageRepository.create({
      supportTicketId: savedTicket.id,
      userId: null,
      message: `Yêu cầu liên hệ từ khách hàng: ${createPublicContactDto.name} (${createPublicContactDto.email})`,
      type: 'system',
    });

    await this.supportMessageRepository.save(systemMessage);

    // Send email confirmation to customer
    try {
      await this.emailService.sendContactConfirmation(
        createPublicContactDto.email,
        createPublicContactDto.name,
        createPublicContactDto.subject,
        savedTicket.id,
      );
    } catch (error) {
      console.error('Failed to send contact confirmation email:', error);
      // Don't throw - the ticket was created successfully
    }

    return {
      success: true,
      message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.',
      ticketId: savedTicket.id,
    };
  }

  async createTicket(userId: string, createSupportTicketDto: CreateSupportTicketDto) {
    const ticket = this.supportTicketRepository.create({
      ...createSupportTicketDto,
      userId,
    });
    
    const savedTicket = await this.supportTicketRepository.save(ticket);
    
    const systemMessage = this.supportMessageRepository.create({
      supportTicketId: savedTicket.id,
      userId,
      message: 'Ticket đã được tạo. Chúng tôi sẽ phản hồi sớm nhất có thể.',
      type: 'system',
    });
    
    await this.supportMessageRepository.save(systemMessage);
    
    return this.findTicketById(savedTicket.id);
  }

  async findUserTickets(userId: string, page: number = 1, limit: number = 20) {
    // Convert to numbers in case they come as strings from query parameters
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const [tickets, total] = await this.supportTicketRepository.findAndCount({
      where: { userId },
      relations: ['assignedTo', 'messages'],
      order: { createdAt: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: tickets,
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

  async findAllTickets(page: number = 1, limit: number = 20, status?: string, priority?: string, search?: string) {
    // Convert to numbers in case they come as strings from query parameters
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const queryBuilder = this.supportTicketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
      .leftJoinAndSelect('assignedTo.profile', 'assignedToProfile')
      .leftJoinAndSelect('ticket.messages', 'messages')
      .orderBy('ticket.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('ticket.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('ticket.priority = :priority', { priority });
    }

    // Search by title, description, guest name/email, or user name/email
    if (search) {
      queryBuilder.andWhere(
        `(ticket.title LIKE :search
          OR ticket.description LIKE :search
          OR ticket.guestName LIKE :search
          OR ticket.guestEmail LIKE :search
          OR user.email LIKE :search
          OR profile.firstName LIKE :search
          OR profile.lastName LIKE :search
          OR ticket.id LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    queryBuilder.skip((pageNum - 1) * limitNum).take(limitNum);

    const [tickets, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: tickets,
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

  async findTicketById(id: string) {
    const ticket = await this.supportTicketRepository.findOne({
      where: { id },
      relations: ['user', 'user.profile', 'assignedTo', 'assignedTo.profile', 'messages', 'messages.user'],
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return ticket;
  }

  async updateTicket(id: string, updateSupportTicketDto: UpdateSupportTicketDto, staffId?: string) {
    const ticket = await this.findTicketById(id);
    
    if (updateSupportTicketDto.status === 'resolved' && !updateSupportTicketDto.resolution) {
      throw new ForbiddenException('Resolution is required when closing ticket');
    }

    if (updateSupportTicketDto.status === 'resolved') {
      updateSupportTicketDto['resolvedAt'] = new Date();
    }

    await this.supportTicketRepository.update(id, updateSupportTicketDto);
    
    if (staffId && updateSupportTicketDto.status) {
      const statusMessage = this.supportMessageRepository.create({
        supportTicketId: id,
        userId: staffId,
        message: `Trạng thái ticket đã được cập nhật thành: ${updateSupportTicketDto.status}`,
        type: 'system',
      });
      
      await this.supportMessageRepository.save(statusMessage);
    }

    return this.findTicketById(id);
  }

  async addMessage(ticketId: string, userId: string, createSupportMessageDto: CreateSupportMessageDto, userRole?: string) {
    const ticket = await this.findTicketById(ticketId);

    if (ticket.userId !== userId && userRole !== 'admin' && userRole !== 'staff') {
      throw new ForbiddenException('Cannot add message to this ticket');
    }

    const messageType = userRole === 'admin' || userRole === 'staff' ? 'staff' : 'user';

    const message = this.supportMessageRepository.create({
      ...createSupportMessageDto,
      supportTicketId: ticketId,
      userId,
      type: messageType,
    });

    const savedMessage = await this.supportMessageRepository.save(message);

    // Send email notification to customer when staff/admin replies
    if (messageType === 'staff') {
      try {
        // Get customer email - either from user account or guest email
        const customerEmail = ticket.user?.email || ticket.guestEmail;
        const customerName = ticket.user?.profile?.name ||
                            ticket.guestName ||
                            'Quý khách';

        // Get staff name from the message sender
        const staffUser = await this.supportMessageRepository.findOne({
          where: { id: savedMessage.id },
          relations: ['user', 'user.profile'],
        });
        const staffName = staffUser?.user?.profile?.name ||
                         'Nhân viên hỗ trợ';

        if (customerEmail) {
          await this.emailService.sendTicketReplyNotification(
            customerEmail,
            customerName,
            ticket.id,
            ticket.title,
            staffName,
            createSupportMessageDto.message,
          );
        }
      } catch (error) {
        console.error('Failed to send ticket reply notification email:', error);
        // Don't throw - the message was saved successfully
      }
    }

    return this.supportMessageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['user'],
    });
  }

  async assignTicket(ticketId: string, staffId: string, assignedById: string) {
    const ticket = await this.findTicketById(ticketId);
    
    await this.supportTicketRepository.update(ticketId, { 
      assignedToId: staffId,
      status: 'in_progress' 
    });

    const assignmentMessage = this.supportMessageRepository.create({
      supportTicketId: ticketId,
      userId: assignedById,
      message: `Ticket đã được chuyển cho nhân viên xử lý`,
      type: 'system',
    });
    
    await this.supportMessageRepository.save(assignmentMessage);
    
    return this.findTicketById(ticketId);
  }

  async getTicketStats() {
    const total = await this.supportTicketRepository.count();
    const open = await this.supportTicketRepository.count({ where: { status: 'open' } });
    const inProgress = await this.supportTicketRepository.count({ where: { status: 'in_progress' } });
    const resolved = await this.supportTicketRepository.count({ where: { status: 'resolved' } });
    const closed = await this.supportTicketRepository.count({ where: { status: 'closed' } });

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
    };
  }
}