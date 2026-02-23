import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Entities
import { User } from '../modules/users/entities/user.entity';
import { UserProfile } from '../modules/users/entities/user-profile.entity';
import { Pet } from '../modules/pets/entities/pet.entity';
import { PetMedicalHistory } from '../modules/pets/entities/pet-medical-history.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { Service } from '../modules/services/entities/service.entity';
import { Product } from '../modules/products/entities/product.entity';
import { ProductVariant } from '../modules/products/entities/product-variant.entity';
import { ProductImage } from '../modules/products/entities/product-image.entity';
import { Appointment } from '../modules/appointments/entities/appointment.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';
import { Review } from '../modules/reviews/entities/review.entity';
import { Post } from '../modules/community/entities/post.entity';
import { Comment } from '../modules/community/entities/comment.entity';
import { Like } from '../modules/community/entities/like.entity';
import { Follow } from '../modules/community/entities/follow.entity';
import { SupportTicket } from '../modules/support/entities/support-ticket.entity';
import { SupportMessage } from '../modules/support/entities/support-message.entity';
import { Consultation } from '../modules/consultation/entities/consultation.entity';
import { ConsultationMessage } from '../modules/consultation/entities/consultation-message.entity';
import { Wishlist } from '../modules/wishlist/entities/wishlist.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { ContentPost } from '../modules/posts/entities/post.entity';
import { DiscountCode } from '../modules/discount-codes/entities/discount-code.entity';
import { Setting } from '../modules/settings/entities/setting.entity';
import { BusinessHour } from '../modules/settings/entities/business-hour.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'petcarehub',
  entities: [
    User,
    UserProfile,
    Pet,
    PetMedicalHistory,
    Category,
    Service,
    Product,
    ProductVariant,
    ProductImage,
    Appointment,
    Order,
    OrderItem,
    Review,
    Post,
    Comment,
    Like,
    Follow,
    SupportTicket,
    SupportMessage,
    Consultation,
    ConsultationMessage,
    Wishlist,
    Notification,
    ContentPost,
    DiscountCode,
    Setting,
    BusinessHour,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
  timezone: '+07:00',
  charset: 'utf8mb4',
});
