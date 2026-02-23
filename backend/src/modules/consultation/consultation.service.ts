import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultation } from './entities/consultation.entity';
import { ConsultationMessage } from './entities/consultation-message.entity';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { CreateConsultationMessageDto } from './dto/create-consultation-message.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

@Injectable()
export class ConsultationService {
  constructor(
    @InjectRepository(Consultation)
    private consultationRepository: Repository<Consultation>,
    @InjectRepository(ConsultationMessage)
    private consultationMessageRepository: Repository<ConsultationMessage>,
  ) {}

  async createConsultation(userId: string, createConsultationDto: CreateConsultationDto) {
    const consultation = this.consultationRepository.create({
      ...createConsultationDto,
      userId,
      status: 'scheduled',
    });
    
    const savedConsultation = await this.consultationRepository.save(consultation);
    
    const welcomeMessage = this.consultationMessageRepository.create({
      consultationId: savedConsultation.id,
      senderId: userId,
      message: 'Yêu cầu tư vấn đã được tạo. Chúng tôi sẽ phân công bác sĩ thú y sớm nhất có thể.',
      messageType: 'text',
    });
    
    await this.consultationMessageRepository.save(welcomeMessage);
    
    return this.findConsultationById(savedConsultation.id);
  }

  async findUserConsultations(userId: string, page: number = 1, limit: number = 20) {
    const [consultations, total] = await this.consultationRepository.findAndCount({
      where: { userId },
      relations: ['vet', 'pet', 'messages'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: consultations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findVetConsultations(vetId: string, page: number = 1, limit: number = 20, status?: string) {
    const queryBuilder = this.consultationRepository.createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.user', 'user')
      .leftJoinAndSelect('consultation.pet', 'pet')
      .leftJoinAndSelect('consultation.messages', 'messages')
      .where('consultation.vetId = :vetId', { vetId })
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

  async findAllConsultations(page: number = 1, limit: number = 20, status?: string, type?: string) {
    const queryBuilder = this.consultationRepository.createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.user', 'user')
      .leftJoinAndSelect('consultation.vet', 'vet')
      .leftJoinAndSelect('consultation.pet', 'pet')
      .leftJoinAndSelect('consultation.messages', 'messages')
      .orderBy('consultation.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('consultation.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('consultation.type = :type', { type });
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

  async findConsultationById(id: string) {
    const consultation = await this.consultationRepository.findOne({
      where: { id },
      relations: ['user', 'vet', 'pet', 'messages', 'messages.sender'],
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    return consultation;
  }

  async updateConsultation(id: string, updateConsultationDto: UpdateConsultationDto, userRole?: string) {
    const consultation = await this.findConsultationById(id);

    if (updateConsultationDto.status === 'active' && !consultation.startedAt) {
      updateConsultationDto['startedAt'] = new Date();
    }

    if (updateConsultationDto.status === 'completed' && !consultation.endedAt) {
      updateConsultationDto['endedAt'] = new Date();
    }

    await this.consultationRepository.update(id, updateConsultationDto);

    return this.findConsultationById(id);
  }

  async assignVet(consultationId: string, vetId: string) {
    const consultation = await this.findConsultationById(consultationId);
    
    await this.consultationRepository.update(consultationId, { 
      vetId,
      status: 'active',
      startedAt: new Date(),
    });

    const assignmentMessage = this.consultationMessageRepository.create({
      consultationId,
      senderId: vetId,
      message: 'Bác sĩ thú y đã được phân công cho cuộc tư vấn này.',
      messageType: 'text',
    });
    
    await this.consultationMessageRepository.save(assignmentMessage);
    
    return this.findConsultationById(consultationId);
  }

  async addMessage(consultationId: string, senderId: string, createConsultationMessageDto: CreateConsultationMessageDto) {
    const consultation = await this.findConsultationById(consultationId);
    
    if (consultation.userId !== senderId && consultation.vetId !== senderId) {
      throw new ForbiddenException('Cannot add message to this consultation');
    }

    const message = this.consultationMessageRepository.create({
      ...createConsultationMessageDto,
      consultationId,
      senderId,
    });

    const savedMessage = await this.consultationMessageRepository.save(message);
    
    return this.consultationMessageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender'],
    });
  }

  async markMessagesAsRead(consultationId: string, userId: string) {
    const consultation = await this.findConsultationById(consultationId);
    
    if (consultation.userId !== userId && consultation.vetId !== userId) {
      throw new ForbiddenException('Cannot mark messages as read');
    }

    await this.consultationMessageRepository.update(
      { 
        consultationId,
        senderId: { $ne: userId } as any,
        isRead: false,
      },
      { isRead: true }
    );

    return { message: 'Messages marked as read' };
  }

  async getConsultationStats() {
    const total = await this.consultationRepository.count();
    const scheduled = await this.consultationRepository.count({ where: { status: 'scheduled' } });
    const active = await this.consultationRepository.count({ where: { status: 'active' } });
    const completed = await this.consultationRepository.count({ where: { status: 'completed' } });
    const cancelled = await this.consultationRepository.count({ where: { status: 'cancelled' } });

    const emergency = await this.consultationRepository.count({ where: { type: 'emergency' } });
    const online = await this.consultationRepository.count({ where: { type: 'online' } });
    const offline = await this.consultationRepository.count({ where: { type: 'offline' } });

    return {
      total,
      byStatus: { scheduled, active, completed, cancelled },
      byType: { emergency, online, offline },
    };
  }

  async getAvailableVets() {
    return this.consultationRepository.query(`
      SELECT u.id, u.email, up.firstName, up.lastName, up.phone
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.userId
      WHERE u.role = 'staff' 
      AND u.isActive = true
    `);
  }
}