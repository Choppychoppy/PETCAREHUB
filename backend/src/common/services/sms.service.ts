import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';

@Injectable()
export class SmsService {
  private twilioClient: Twilio.Twilio;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    
    if (accountSid && authToken) {
      this.twilioClient = Twilio(accountSid, authToken);
    } else {
      console.warn('Twilio credentials not provided. SMS functionality will be disabled.');
    }
  }

  async sendSms(to: string, message: string): Promise<void> {
    if (!this.twilioClient) {
      console.warn('SMS service not initialized. Skipping SMS send.');
      return;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: this.configService.get('TWILIO_PHONE_NUMBER'),
        to,
      });
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
    }
  }

  async sendAppointmentReminder(
    phoneNumber: string,
    customerName: string,
    appointmentDetails: {
      serviceName: string;
      petName: string;
      dateTime: Date;
    },
  ): Promise<void> {
    const formattedDate = appointmentDetails.dateTime.toLocaleDateString('vi-VN');
    const formattedTime = appointmentDetails.dateTime.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const message = `
Xin chào ${customerName}!

Nhắc nhở lịch hẹn PetCare Hub:
📅 ${formattedDate} lúc ${formattedTime}
🐾 Dịch vụ: ${appointmentDetails.serviceName}
🐕 Thú cưng: ${appointmentDetails.petName}

Vui lòng đến đúng giờ. Cảm ơn bạn!
    `.trim();

    await this.sendSms(phoneNumber, message);
  }

  async sendOrderStatusUpdate(
    phoneNumber: string,
    customerName: string,
    orderNumber: string,
    status: string,
    trackingNumber?: string,
  ): Promise<void> {
    let message = `Xin chào ${customerName}!\n\nĐơn hàng #${orderNumber} đã được cập nhật:\nTrạng thái: ${status}`;

    if (trackingNumber) {
      message += `\nMã vận đơn: ${trackingNumber}`;
    }

    message += '\n\nCảm ơn bạn đã mua sắm tại PetCare Hub!';

    await this.sendSms(phoneNumber, message);
  }

  async sendNotificationSms(phoneNumber: string, message: string): Promise<void> {
    const smsMessage = `PetCare Hub: ${message}`;
    await this.sendSms(phoneNumber, smsMessage);
  }
}