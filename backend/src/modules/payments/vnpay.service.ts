import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface VNPayConfig {
  tmnCode: string;
  hashSecret: string;
  url: string;
  returnUrl: string;
  apiUrl: string;
}

export interface VNPayPaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  ipAddr: string;
  locale?: string;
  bankCode?: string;
}

export interface VNPayReturnParams {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo?: string;
  vnp_CardType?: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
}

@Injectable()
export class VNPayService {
  private config: VNPayConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      tmnCode: this.configService.get('VNPAY_TMN_CODE') || 'B77INC60',
      hashSecret: this.configService.get('VNPAY_HASH_SECRET') || 'NU3W61XPNAW4DDRSYM30E0G4GL97VG7M',
      url: this.configService.get('VNPAY_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl: this.configService.get('VNPAY_RETURN_URL') || 'http://localhost:5173/payment/vnpay-return',
      apiUrl: this.configService.get('VNPAY_API_URL') || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
    };
  }

  /**
   * Create VNPay payment URL
   */
  createPaymentUrl(params: VNPayPaymentParams): string {
    const date = new Date();
    const createDate = this.formatDate(date, 'yyyyMMddHHmmss');
    const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000), 'yyyyMMddHHmmss'); // 15 minutes

    let vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.config.tmnCode,
      vnp_Locale: params.locale || 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: String(params.amount * 100), // VNPay requires amount in VND * 100
      vnp_ReturnUrl: this.config.returnUrl,
      vnp_IpAddr: params.ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    if (params.bankCode) {
      vnpParams['vnp_BankCode'] = params.bankCode;
    }

    // Sort params alphabetically
    vnpParams = this.sortObject(vnpParams);

    // Create query string
    const queryString = new URLSearchParams(vnpParams).toString();

    // Create secure hash
    const hmac = crypto.createHmac('sha512', this.config.hashSecret);
    const secureHash = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');

    // Return full URL
    return `${this.config.url}?${queryString}&vnp_SecureHash=${secureHash}`;
  }

  /**
   * Verify VNPay return data
   */
  verifyReturnUrl(vnpParams: Record<string, string>): {
    isValid: boolean;
    orderId: string;
    amount: number;
    responseCode: string;
    transactionNo: string;
    message: string;
  } {
    const secureHash = vnpParams['vnp_SecureHash'];

    // Remove hash params for verification
    const params = { ...vnpParams };
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    // Sort and create query string
    const sortedParams = this.sortObject(params);
    const queryString = new URLSearchParams(sortedParams).toString();

    // Create hash to compare
    const hmac = crypto.createHmac('sha512', this.config.hashSecret);
    const checkHash = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');

    const isValid = secureHash === checkHash;
    const responseCode = vnpParams['vnp_ResponseCode'] || '';
    const transactionStatus = vnpParams['vnp_TransactionStatus'] || '';

    return {
      isValid,
      orderId: vnpParams['vnp_TxnRef'] || '',
      amount: parseInt(vnpParams['vnp_Amount'] || '0') / 100,
      responseCode,
      transactionNo: vnpParams['vnp_TransactionNo'] || '',
      message: this.getResponseMessage(responseCode, transactionStatus),
    };
  }

  /**
   * Get response message from code
   */
  private getResponseMessage(responseCode: string, transactionStatus: string): string {
    if (responseCode === '00' && transactionStatus === '00') {
      return 'Giao dịch thành công';
    }

    const messages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
      '09': 'Giao dịch không thành công: Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
      '10': 'Giao dịch không thành công: Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công: Đã hết hạn chờ thanh toán',
      '12': 'Giao dịch không thành công: Thẻ/Tài khoản bị khóa',
      '13': 'Giao dịch không thành công: Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
      '24': 'Giao dịch không thành công: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công: Tài khoản không đủ số dư',
      '65': 'Giao dịch không thành công: Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Giao dịch không thành công: Nhập sai mật khẩu thanh toán quá số lần quy định',
      '99': 'Các lỗi khác',
    };

    return messages[responseCode] || 'Giao dịch không thành công';
  }

  /**
   * Sort object by key alphabetically
   */
  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = obj[key];
    }
    return sorted;
  }

  /**
   * Format date to string
   */
  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('yyyy', year)
      .replace('MM', month)
      .replace('dd', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }
}
