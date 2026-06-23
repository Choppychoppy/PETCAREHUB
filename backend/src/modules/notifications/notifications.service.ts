import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { EmailService } from '../../common/services/email.service';
import { SmsService } from '../../common/services/sms.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  async createNotification(createNotificationDto: CreateNotificationDto) {
    const notification = this.notificationRepository.create(createNotificationDto);
    const savedNotification = await this.notificationRepository.save(notification);

    if (!createNotificationDto.scheduledAt || new Date(createNotificationDto.scheduledAt) <= new Date()) {
      await this.sendNotificationChannels(savedNotification.id);
    }

    return this.notificationRepository.findOne({
      where: { id: savedNotification.id },
      relations: ['user'],
    });
  }

  async createBulkNotifications(userIds: string[], notificationData: Omit<CreateNotificationDto, 'userId'>) {
    const notifications = userIds.map(userId => 
      this.notificationRepository.create({ ...notificationData, userId })
    );

    const savedNotifications = await this.notificationRepository.save(notifications);

    for (const notification of savedNotifications) {
      if (!notificationData.scheduledAt || new Date(notificationData.scheduledAt) <= new Date()) {
        await this.sendNotificationChannels(notification.id);
      }
    }

    return {
      message: `${savedNotifications.length} notifications created successfully`,
      count: savedNotifications.length,
    };
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20, type?: string, isRead?: boolean) {
    const queryBuilder = this.notificationRepository.createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    if (isRead !== undefined) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [notifications, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    
    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getNotificationById(id: string, userId?: string) {
    const queryBuilder = this.notificationRepository.createQueryBuilder('notification')
      .where('notification.id = :id', { id });

    if (userId) {
      queryBuilder.andWhere('notification.userId = :userId', { userId });
    }

    const notification = await queryBuilder.getOne();

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    return notification;
  }

  async updateNotification(id: string, updateNotificationDto: UpdateNotificationDto, userId?: string) {
    const notification = await this.getNotificationById(id, userId);

    await this.notificationRepository.update(id, updateNotificationDto);

    return this.getNotificationById(id, userId);
  }

  async markAsRead(id: string, userId: string) {
    return this.updateNotification(id, { isRead: true }, userId);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );

    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(id: string, userId?: string) {
    const notification = await this.getNotificationById(id, userId);

    await this.notificationRepository.remove(notification);

    return { message: 'Notification deleted successfully' };
  }

  async deleteAllNotifications(userId: string) {
    await this.notificationRepository.delete({ userId });

    return { message: 'All notifications deleted successfully' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  async processScheduledNotifications() {
    const scheduledNotifications = await this.notificationRepository.find({
      where: {
        scheduledAt: LessThanOrEqual(new Date()),
        emailSent: false,
        smsSent: false,
      },
      relations: ['user'],
    });

    for (const notification of scheduledNotifications) {
      await this.sendNotificationChannels(notification.id);
    }

    return {
      message: `${scheduledNotifications.length} scheduled notifications processed`,
      count: scheduledNotifications.length,
    };
  }

  private async sendNotificationChannels(notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
      relations: ['user', 'user.profile'],
    });

    if (!notification) return;

    const user = notification.user;
    const updateData: any = {};

    try {
      if (user.email && ['high', 'medium'].includes(notification.priority)) {
        await this.emailService.sendNotificationEmail(
          user.email,
          notification.title,
          notification.message,
          notification.actionUrl
        );
        updateData.emailSent = true;
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }

    try {
      if (user.profile?.phone && notification.priority === 'high') {
        await this.smsService.sendNotificationSms(
          user.profile.phone,
          notification.message
        );
        updateData.smsSent = true;
      }
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
    }

    if (Object.keys(updateData).length > 0) {
      await this.notificationRepository.update(notificationId, updateData);
    }
  }

  async getNotificationStats() {
    const total = await this.notificationRepository.count();
    const unread = await this.notificationRepository.count({ where: { isRead: false } });
    const byType = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('notification.type')
      .getRawMany();

    const byPriority = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('notification.priority')
      .getRawMany();

    return {
      total,
      unread,
      byType,
      byPriority,
    };
  }

  async createSystemNotification(title: string, message: string, userIds?: string[], data?: any) {
    if (!userIds || userIds.length === 0) {
      const allUserIds = await this.notificationRepository.query(`
        SELECT id FROM users WHERE isActive = true
      `);
      userIds = allUserIds.map(user => user.id);
    }

    return this.createBulkNotifications(userIds, {
      title,
      message,
      type: 'system',
      priority: 'medium',
      data,
    });
  }
}