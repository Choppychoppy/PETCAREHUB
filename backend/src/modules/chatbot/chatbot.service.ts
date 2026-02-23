import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import OpenAI from 'openai';
import { Product } from '../products/entities/product.entity';
import { Service } from '../services/entities/service.entity';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ProductInfo {
  id: string;
  name: string;
  price: number;
  description: string;
  stockQuantity: number;
}

interface ServiceInfo {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: number;
}

@Injectable()
export class ChatbotService {
  private openai: OpenAI | null = null;
  private isConfigured: boolean = false;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.isConfigured = true;
      console.log('OpenAI chatbot service configured');
    } else {
      console.warn('OpenAI API key not provided. Chatbot will use fallback responses.');
    }
  }

  // Search products by keyword
  async searchProducts(keyword: string, limit: number = 5): Promise<ProductInfo[]> {
    try {
      const products = await this.productRepository.find({
        where: [
          { name: Like(`%${keyword}%`), isActive: true },
          { description: Like(`%${keyword}%`), isActive: true },
          { brand: Like(`%${keyword}%`), isActive: true },
        ],
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return products.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        description: p.shortDescription || p.description?.substring(0, 100) || '',
        stockQuantity: p.stockQuantity,
      }));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  // Get featured/popular products
  async getPopularProducts(limit: number = 5): Promise<ProductInfo[]> {
    try {
      const products = await this.productRepository.find({
        where: { isActive: true },
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return products.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        description: p.shortDescription || p.description?.substring(0, 100) || '',
        stockQuantity: p.stockQuantity,
      }));
    } catch (error) {
      console.error('Error getting popular products:', error);
      return [];
    }
  }

  // Search services by keyword
  async searchServices(keyword: string, limit: number = 5): Promise<ServiceInfo[]> {
    try {
      const services = await this.serviceRepository.find({
        where: [
          { name: Like(`%${keyword}%`), isActive: true },
          { description: Like(`%${keyword}%`), isActive: true },
        ],
        take: limit,
        order: { sortOrder: 'ASC' },
      });

      return services.map(s => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        description: s.description?.substring(0, 100) || '',
        duration: s.duration,
      }));
    } catch (error) {
      console.error('Error searching services:', error);
      return [];
    }
  }

  // Get all active services
  async getAllServices(limit: number = 10): Promise<ServiceInfo[]> {
    try {
      const services = await this.serviceRepository.find({
        where: { isActive: true },
        take: limit,
        order: { sortOrder: 'ASC' },
      });

      return services.map(s => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        description: s.description?.substring(0, 100) || '',
        duration: s.duration,
      }));
    } catch (error) {
      console.error('Error getting all services:', error);
      return [];
    }
  }

  // Format price to VND
  private formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  // Format products list for response
  private formatProductsList(products: ProductInfo[]): string {
    if (products.length === 0) {
      return 'Hiện tại chưa có sản phẩm phù hợp.';
    }

    return products.map((p, i) =>
      `${i + 1}. **${p.name}** - ${this.formatPrice(p.price)}${p.stockQuantity > 0 ? ' ✅ Còn hàng' : ' ❌ Hết hàng'}`
    ).join('\n');
  }

  // Format services list for response
  private formatServicesList(services: ServiceInfo[]): string {
    if (services.length === 0) {
      return 'Hiện tại chưa có dịch vụ phù hợp.';
    }

    return services.map((s, i) =>
      `${i + 1}. **${s.name}** - ${this.formatPrice(s.price)} (${s.duration} phút)`
    ).join('\n');
  }

  private async getSystemPrompt(): Promise<string> {
    // Get current products and services for context
    const products = await this.getPopularProducts(10);
    const services = await this.getAllServices(10);

    const productsInfo = products.length > 0
      ? `\n\nSản phẩm hiện có:\n${products.map(p => `- ${p.name}: ${this.formatPrice(p.price)}`).join('\n')}`
      : '';

    const servicesInfo = services.length > 0
      ? `\n\nDịch vụ hiện có:\n${services.map(s => `- ${s.name}: ${this.formatPrice(s.price)} (${s.duration} phút)`).join('\n')}`
      : '';

    return `Bạn là trợ lý ảo của PetCare Hub - nền tảng chăm sóc thú cưng hàng đầu Việt Nam.

Vai trò của bạn:
- Tư vấn về chăm sóc thú cưng (chó, mèo, hamster, chim, cá cảnh...)
- Giới thiệu các dịch vụ và sản phẩm của cửa hàng
- Hỗ trợ đặt lịch hẹn và mua sản phẩm
- Giải đáp thắc mắc về sức khỏe thú cưng
- Cung cấp tips chăm sóc thú cưng

Quy tắc:
1. Luôn trả lời bằng tiếng Việt
2. Thân thiện, chuyên nghiệp và nhiệt tình
3. Nếu không chắc chắn về vấn đề y tế, khuyên khách hàng đến khám trực tiếp
4. Giữ câu trả lời ngắn gọn, dễ hiểu (tối đa 3-4 câu)
5. Sử dụng emoji phù hợp để tạo cảm giác thân thiện 🐾🐶🐱
6. Khi khách hỏi về sản phẩm hoặc dịch vụ, hãy giới thiệu các sản phẩm/dịch vụ thực tế của cửa hàng
7. Khuyến khích khách hàng truy cập trang /products để xem sản phẩm và /services để xem dịch vụ

Thông tin liên hệ PetCare Hub:
- Hotline: 0123 456 789
- Email: support@petcarehub.vn
- Giờ làm việc: 8:00 - 20:00 hàng ngày
- Website: http://localhost:5173${productsInfo}${servicesInfo}`;
  }

  private async getFallbackResponse(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Greeting responses
    if (lowerMessage.includes('xin chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('chào')) {
      return 'Xin chào! 👋 Tôi là trợ lý ảo của PetCare Hub. Tôi có thể giúp bạn tư vấn về chăm sóc thú cưng, đặt lịch dịch vụ, hoặc tìm sản phẩm phù hợp. Bạn cần hỗ trợ gì ạ? 🐾';
    }

    // Service-related - fetch real services
    if (lowerMessage.includes('dịch vụ') || lowerMessage.includes('khám') || lowerMessage.includes('grooming') || lowerMessage.includes('spa') || lowerMessage.includes('vaccine') || lowerMessage.includes('cắt tỉa')) {
      const services = await this.getAllServices(5);
      if (services.length > 0) {
        const servicesList = this.formatServicesList(services);
        return `PetCare Hub cung cấp các dịch vụ chăm sóc thú cưng sau! 🏥\n\n${servicesList}\n\n👉 Truy cập trang **/services** để xem chi tiết và đặt lịch!\nBạn quan tâm đến dịch vụ nào? Tôi có thể giúp bạn đặt lịch ngay!`;
      }
      return 'PetCare Hub cung cấp nhiều dịch vụ chăm sóc thú cưng! 🏥\n\n• Khám sức khỏe định kỳ\n• Grooming & Spa\n• Tiêm vaccine\n• Phẫu thuật\n• Tư vấn dinh dưỡng\n\n👉 Truy cập **/services** để xem chi tiết!\nBạn quan tâm đến dịch vụ nào?';
    }

    // Product-related - fetch real products
    if (lowerMessage.includes('sản phẩm') || lowerMessage.includes('mua') || lowerMessage.includes('thức ăn') || lowerMessage.includes('đồ chơi') || lowerMessage.includes('phụ kiện') || lowerMessage.includes('shop') || lowerMessage.includes('hàng')) {
      const products = await this.getPopularProducts(5);
      if (products.length > 0) {
        const productsList = this.formatProductsList(products);
        return `Chúng tôi có nhiều sản phẩm cho thú cưng! 🛒\n\n${productsList}\n\n👉 Truy cập trang **/products** để xem tất cả sản phẩm!\nBạn cần tư vấn sản phẩm nào không ạ?`;
      }
      return 'Chúng tôi có đa dạng sản phẩm cho thú cưng! 🛒\n\n• Thức ăn cao cấp\n• Đồ chơi & phụ kiện\n• Sản phẩm vệ sinh\n• Thuốc & vitamin\n\n👉 Truy cập **/products** để xem chi tiết!\nBạn cần tư vấn sản phẩm nào không ạ?';
    }

    // Search for specific products
    if (lowerMessage.includes('tìm') || lowerMessage.includes('có không') || lowerMessage.includes('bán')) {
      // Extract search keyword
      const keywords = ['chó', 'mèo', 'thức ăn', 'đồ chơi', 'thuốc', 'vitamin', 'sữa tắm', 'vòng cổ', 'dây dắt', 'lồng', 'chuồng', 'bát ăn'];
      let searchKeyword = '';
      for (const kw of keywords) {
        if (lowerMessage.includes(kw)) {
          searchKeyword = kw;
          break;
        }
      }

      if (searchKeyword) {
        const products = await this.searchProducts(searchKeyword, 5);
        if (products.length > 0) {
          const productsList = this.formatProductsList(products);
          return `Tôi tìm thấy một số sản phẩm liên quan đến "${searchKeyword}"! 🔍\n\n${productsList}\n\n👉 Truy cập **/products** để xem thêm!`;
        }
        return `Xin lỗi, tôi không tìm thấy sản phẩm "${searchKeyword}" trong kho. 😔\n\nBạn có thể:\n• Truy cập **/products** để xem tất cả sản phẩm\n• Liên hệ hotline 0123 456 789 để được hỗ trợ`;
      }
    }

    // Booking-related
    if (lowerMessage.includes('đặt lịch') || lowerMessage.includes('hẹn') || lowerMessage.includes('book')) {
      const services = await this.getAllServices(3);
      let serviceInfo = '';
      if (services.length > 0) {
        serviceInfo = `\n\nDịch vụ phổ biến:\n${services.map(s => `• ${s.name}: ${this.formatPrice(s.price)}`).join('\n')}\n`;
      }
      return `Để đặt lịch hẹn, bạn có thể: 📅\n\n1. Vào trang **/services** và chọn dịch vụ cần đặt\n2. Chọn thời gian và thú cưng của bạn\n3. Xác nhận đặt lịch${serviceInfo}\nHoặc gọi hotline **0123 456 789** để được hỗ trợ trực tiếp! 📞`;
    }

    // Health-related
    if (lowerMessage.includes('bệnh') || lowerMessage.includes('ốm') || lowerMessage.includes('sức khỏe') || lowerMessage.includes('triệu chứng')) {
      return 'Tôi hiểu bạn lo lắng về sức khỏe của thú cưng! 💝\n\nVới các vấn đề sức khỏe, tốt nhất bạn nên đưa thú cưng đến khám trực tiếp để bác sĩ thú y có thể chẩn đoán chính xác.\n\n👉 Đặt lịch khám tại **/services**\n📞 Hotline khẩn cấp: 0123 456 789';
    }

    // Price-related
    if (lowerMessage.includes('giá') || lowerMessage.includes('bao nhiêu') || lowerMessage.includes('chi phí') || lowerMessage.includes('phí')) {
      const services = await this.getAllServices(5);
      if (services.length > 0) {
        const servicesList = this.formatServicesList(services);
        return `Bảng giá dịch vụ tại PetCare Hub: 💰\n\n${servicesList}\n\n👉 Xem chi tiết tại **/services**\nGiá có thể thay đổi tùy theo kích thước thú cưng. Bạn cần báo giá chi tiết cho dịch vụ nào ạ?`;
      }
      return 'Về chi phí dịch vụ tại PetCare Hub:\n\n• Khám tổng quát: từ 200.000đ\n• Grooming cơ bản: từ 150.000đ\n• Tiêm vaccine: từ 250.000đ\n\n👉 Xem chi tiết tại **/services**\nGiá có thể thay đổi tùy theo kích thước thú cưng.';
    }

    // Contact
    if (lowerMessage.includes('liên hệ') || lowerMessage.includes('địa chỉ') || lowerMessage.includes('hotline') || lowerMessage.includes('số điện thoại')) {
      return 'Thông tin liên hệ PetCare Hub:\n\n📍 Địa chỉ: 123 Nguyễn Văn A, Q.1, TP.HCM\n📞 Hotline: 0123 456 789\n📧 Email: support@petcarehub.vn\n⏰ Giờ làm việc: 8:00 - 20:00\n🌐 Website: http://localhost:5173\n\nRất vui được hỗ trợ bạn! 🐾';
    }

    // Pet care tips
    if (lowerMessage.includes('chăm sóc') || lowerMessage.includes('nuôi') || lowerMessage.includes('tips') || lowerMessage.includes('mẹo')) {
      return 'Một số tips chăm sóc thú cưng cơ bản! 🐾\n\n🍖 Cho ăn đúng giờ, đúng lượng\n💧 Luôn có nước sạch\n🛁 Tắm rửa định kỳ\n🏃 Vận động hàng ngày\n💉 Tiêm phòng đầy đủ\n🏥 Khám sức khỏe định kỳ\n\n👉 Xem thêm sản phẩm chăm sóc tại **/products**!';
    }

    // Default response
    return 'Cảm ơn bạn đã liên hệ! 🐾\n\nTôi có thể giúp bạn với:\n• 🛒 Xem sản phẩm: **/products**\n• 🏥 Xem dịch vụ: **/services**\n• 📅 Đặt lịch hẹn\n• ❓ Giải đáp thắc mắc\n\nBạn có thể cho tôi biết thêm chi tiết về vấn đề của bạn không ạ?';
  }

  async chat(message: string, history: ChatMessage[] = []): Promise<string> {
    // Use fallback if OpenAI is not configured
    if (!this.isConfigured || !this.openai) {
      return this.getFallbackResponse(message);
    }

    try {
      const systemPrompt = await this.getSystemPrompt();
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: message },
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || await this.getFallbackResponse(message);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getFallbackResponse(message);
    }
  }

  async getWelcomeMessage(): Promise<string> {
    const services = await this.getAllServices(3);
    const products = await this.getPopularProducts(3);

    let welcomeExtras = '';
    if (services.length > 0) {
      welcomeExtras += `\n\n🏥 **Dịch vụ nổi bật:**\n${services.map(s => `• ${s.name}`).join('\n')}`;
    }
    if (products.length > 0) {
      welcomeExtras += `\n\n🛒 **Sản phẩm mới:**\n${products.map(p => `• ${p.name}`).join('\n')}`;
    }

    return `Xin chào! 👋 Tôi là trợ lý ảo của PetCare Hub.\n\nTôi có thể giúp bạn:\n🐾 Tư vấn chăm sóc thú cưng\n📅 Đặt lịch dịch vụ\n🛒 Tìm sản phẩm phù hợp\n❓ Giải đáp thắc mắc${welcomeExtras}\n\nBạn cần hỗ trợ gì ạ?`;
  }
}
