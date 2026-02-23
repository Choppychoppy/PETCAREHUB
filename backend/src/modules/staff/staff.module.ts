import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Consultation } from '../consultation/entities/consultation.entity';
import { SupportTicket } from '../support/entities/support-ticket.entity';
import { Order } from '../orders/entities/order.entity';
import { Post } from '../community/entities/post.entity';
import { Comment } from '../community/entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Consultation,
      SupportTicket,
      Order,
      Post,
      Comment,
    ]),
  ],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}