import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// Provider gửi email: 'resend' (ưu tiên) hoặc 'smtp' (dự phòng)
type EmailProvider = 'resend' | 'smtp' | 'none';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private provider: EmailProvider = 'none';
  private resendApiKey: string;
  private fromAddress: string;
  private fromName: string;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Thông tin người gửi (dùng chung cho mọi provider)
    this.fromName =
      this.configService.get('MAIL_FROM_NAME') ||
      this.configService.get('SMTP_FROM_NAME') ||
      'PetCare Hub';
    this.fromAddress =
      this.configService.get('MAIL_FROM_ADDRESS') ||
      this.configService.get('SMTP_FROM_EMAIL') ||
      this.configService.get('SMTP_USERNAME');

    // Ưu tiên Resend nếu có API key
    this.resendApiKey = this.configService.get('RESEND_API_KEY');
    if (this.resendApiKey) {
      this.provider = 'resend';
      console.log('Email service configured with Resend');
      return;
    }

    // Dự phòng: SMTP (Nodemailer)
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpUser = this.configService.get('SMTP_USERNAME');
    const smtpPass = this.configService.get('SMTP_PASSWORD');
    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(this.configService.get('SMTP_PORT')) || 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });
      this.provider = 'smtp';
      console.log('Email service configured with SMTP');
      return;
    }

    console.warn('Chưa cấu hình email (RESEND_API_KEY hoặc SMTP). Chức năng gửi email sẽ bị tắt.');
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    if (this.provider === 'none') {
      console.warn('Email service not configured. Skipping email send.');
      return;
    }

    if (this.provider === 'resend') {
      await this.sendViaResend(to, subject, text, html);
      return;
    }

    // SMTP (dự phòng)
    const mailOptions = {
      from: { name: this.fromName, address: this.fromAddress },
      to,
      subject,
      text,
      html,
    };
    try {
      await this.transporter!.sendMail(mailOptions);
      console.log('Email sent successfully to:', to);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  // Gửi email qua Resend HTTP API (https://resend.com)
  private async sendViaResend(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromAddress}>`,
          to: [to],
          subject,
          html: html || undefined,
          text: text || undefined,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Resend API lỗi ${res.status}: ${detail}`);
      }
      console.log('Email sent successfully (Resend) to:', to);
    } catch (error) {
      console.error('Email sending failed (Resend):', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Chào mừng bạn đến với PetCare Hub!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2E86AB;">Chào mừng ${name}!</h1>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại PetCare Hub - nền tảng chăm sóc thú cưng hàng đầu.</p>
        <p>Với PetCare Hub, bạn có thể:</p>
        <ul>
          <li>Đặt lịch khám và chăm sóc cho thú cưng</li>
          <li>Mua sắm các sản phẩm chất lượng</li>
          <li>Kết nối với cộng đồng yêu thú cưng</li>
          <li>Nhận tư vấn từ các chuyên gia thú y</li>
        </ul>
        <p>Hãy bắt đầu khám phá ngay hôm nay!</p>
        <div style="margin: 30px 0;">
          <a href="${this.configService.get('FRONTEND_URL')}" 
             style="background-color: #2E86AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Khám phá ngay
          </a>
        </div>
        <p>Trân trọng,<br>Đội ngũ PetCare Hub</p>
      </div>
    `;

    await this.sendEmail(email, subject, '', html);
  }

  async sendVerificationOtpEmail(email: string, name: string, otp: string): Promise<void> {
    const subject = 'Mã xác minh tài khoản - PetCare Hub';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2E86AB; margin: 0;">🐾 PetCare Hub</h1>
        </div>

        <h2 style="color: #333;">Xin chào ${name}!</h2>

        <p style="color: #555; line-height: 1.6;">
          Cảm ơn bạn đã đăng ký tài khoản tại PetCare Hub. Vui lòng nhập mã xác minh bên dưới
          để hoàn tất việc đăng ký:
        </p>

        <div style="background-color: #f8f9fa; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center; border: 1px dashed #2E86AB;">
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #2E86AB;">
            ${otp}
          </div>
        </div>

        <p style="color: #555; line-height: 1.6;">
          Mã xác minh này sẽ <strong>hết hạn sau 15 phút</strong>. Vui lòng không chia sẻ mã này
          cho bất kỳ ai.
        </p>

        <p style="color: #555; line-height: 1.6;">
          Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 14px;">
            Trân trọng,<br>
            <strong>Đội ngũ PetCare Hub</strong>
          </p>
        </div>
      </div>
    `;

    await this.sendEmail(email, subject, `Mã xác minh PetCare Hub của bạn là: ${otp} (hết hạn sau 15 phút).`, html);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const subject = 'Đặt lại mật khẩu - PetCare Hub';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2E86AB;">Đặt lại mật khẩu</h1>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản PetCare Hub của mình.</p>
        <p>Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #F18F01; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Đặt lại mật khẩu
          </a>
        </div>
        <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br>Đội ngũ PetCare Hub</p>
      </div>
    `;

    await this.sendEmail(email, subject, '', html);
  }

  async sendAppointmentConfirmation(
    email: string,
    customerName: string,
    appointmentDetails: {
      serviceName: string;
      petName: string;
      dateTime: Date;
      duration: number;
      price: number;
    },
  ): Promise<void> {
    const subject = 'Xác nhận lịch hẹn - PetCare Hub';
    const formattedDate = appointmentDetails.dateTime.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = appointmentDetails.dateTime.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2E86AB;">Lịch hẹn đã được xác nhận!</h1>
        <p>Xin chào ${customerName},</p>
        <p>Lịch hẹn của bạn tại PetCare Hub đã được xác nhận:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2E86AB; margin-top: 0;">Chi tiết lịch hẹn</h3>
          <p><strong>Dịch vụ:</strong> ${appointmentDetails.serviceName}</p>
          <p><strong>Thú cưng:</strong> ${appointmentDetails.petName}</p>
          <p><strong>Ngày:</strong> ${formattedDate}</p>
          <p><strong>Thời gian:</strong> ${formattedTime}</p>
          <p><strong>Thời lượng:</strong> ${appointmentDetails.duration} phút</p>
          <p><strong>Chi phí:</strong> ${appointmentDetails.price.toLocaleString('vi-VN')} VNĐ</p>
        </div>

        <p>Vui lòng đến đúng giờ và mang theo thú cưng của bạn.</p>
        <p>Nếu cần thay đổi hoặc hủy lịch hẹn, vui lòng liên hệ với chúng tôi trước 24 giờ.</p>
        
        <p>Cảm ơn bạn đã tin tưởng PetCare Hub!</p>
        <p>Trân trọng,<br>Đội ngũ PetCare Hub</p>
      </div>
    `;

    await this.sendEmail(email, subject, '', html);
  }

  async sendNotificationEmail(
    email: string,
    title: string,
    message: string,
    actionUrl?: string,
  ): Promise<void> {
    const subject = title;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2E86AB;">${title}</h1>
        <p>${message}</p>
        ${actionUrl ? `
          <div style="margin: 30px 0;">
            <a href="${actionUrl}"
               style="background-color: #2E86AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Xem chi tiết
            </a>
          </div>
        ` : ''}
        <p>Trân trọng,<br>Đội ngũ PetCare Hub</p>
      </div>
    `;

    await this.sendEmail(email, subject, message, html);
  }

  async sendContactConfirmation(
    email: string,
    name: string,
    subject: string,
    ticketId: string,
  ): Promise<void> {
    const emailSubject = 'Xác nhận liên hệ - PetCare Hub';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2E86AB; margin: 0;">🐾 PetCare Hub</h1>
        </div>

        <h2 style="color: #333;">Xin chào ${name}!</h2>

        <p style="color: #555; line-height: 1.6;">
          Chúng tôi đã nhận được yêu cầu liên hệ của bạn và sẽ phản hồi sớm nhất có thể.
        </p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E86AB;">
          <h3 style="color: #2E86AB; margin-top: 0;">Chi tiết yêu cầu</h3>
          <p style="margin: 5px 0;"><strong>Mã yêu cầu:</strong> #${ticketId.slice(0, 8).toUpperCase()}</p>
          <p style="margin: 5px 0;"><strong>Chủ đề:</strong> ${subject}</p>
          <p style="margin: 5px 0;"><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        </div>

        <p style="color: #555; line-height: 1.6;">
          Đội ngũ chăm sóc khách hàng của chúng tôi sẽ liên hệ với bạn trong vòng <strong>24 giờ làm việc</strong>.
        </p>

        <p style="color: #555; line-height: 1.6;">
          Nếu có vấn đề khẩn cấp, vui lòng liên hệ trực tiếp qua:
        </p>
        <ul style="color: #555;">
          <li>Hotline: <a href="tel:0123456789" style="color: #2E86AB;">0123 456 789</a></li>
          <li>Email: <a href="mailto:support@petcarehub.vn" style="color: #2E86AB;">support@petcarehub.vn</a></li>
        </ul>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 14px;">
            Cảm ơn bạn đã tin tưởng PetCare Hub!<br>
            Trân trọng,<br>
            <strong>Đội ngũ PetCare Hub</strong>
          </p>
        </div>
      </div>
    `;

    await this.sendEmail(email, emailSubject, '', html);
  }

  async sendTicketReplyNotification(
    email: string,
    customerName: string,
    ticketId: string,
    ticketTitle: string,
    staffName: string,
    replyMessage: string,
  ): Promise<void> {
    const emailSubject = `Phản hồi yêu cầu hỗ trợ #${ticketId.slice(0, 8).toUpperCase()} - PetCare Hub`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2E86AB; margin: 0;">🐾 PetCare Hub</h1>
        </div>

        <h2 style="color: #333;">Xin chào ${customerName}!</h2>

        <p style="color: #555; line-height: 1.6;">
          Yêu cầu hỗ trợ của bạn đã được phản hồi.
        </p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E86AB;">
          <h3 style="color: #2E86AB; margin-top: 0;">Thông tin yêu cầu</h3>
          <p style="margin: 5px 0;"><strong>Mã yêu cầu:</strong> #${ticketId.slice(0, 8).toUpperCase()}</p>
          <p style="margin: 5px 0;"><strong>Chủ đề:</strong> ${ticketTitle}</p>
        </div>

        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="color: #4CAF50; margin-top: 0;">💬 Phản hồi từ ${staffName}</h3>
          <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${replyMessage}</p>
        </div>

        <p style="color: #555; line-height: 1.6;">
          Nếu bạn cần hỗ trợ thêm, vui lòng phản hồi email này hoặc đăng nhập vào tài khoản để xem chi tiết.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 14px;">
            Cảm ơn bạn đã tin tưởng PetCare Hub!<br>
            Trân trọng,<br>
            <strong>Đội ngũ PetCare Hub</strong>
          </p>
        </div>
      </div>
    `;

    await this.sendEmail(email, emailSubject, replyMessage, html);
  }
}