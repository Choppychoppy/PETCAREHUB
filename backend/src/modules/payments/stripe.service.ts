import { Injectable } from '@nestjs/common';

@Injectable()
export class StripeService {
  async createPaymentIntent(amount: number, currency: string = 'usd') {
    return { 
      message: 'Stripe payment intent created', 
      data: { amount, currency, clientSecret: 'pi_mock_secret' } 
    };
  }

  async confirmPayment(paymentIntentId: string) {
    return { 
      message: 'Payment confirmed with Stripe', 
      data: { paymentIntentId, status: 'succeeded' } 
    };
  }
}