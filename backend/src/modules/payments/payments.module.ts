import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { VNPayService } from './vnpay.service';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService, VNPayService],
  exports: [PaymentsService, StripeService, VNPayService],
})
export class PaymentsModule {}