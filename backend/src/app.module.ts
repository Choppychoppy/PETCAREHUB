import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Core modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PetsModule } from './modules/pets/pets.module';
import { CommunityModule } from './modules/community/community.module';
import { SupportModule } from './modules/support/support.module';
import { ConsultationModule } from './modules/consultation/consultation.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { StaffModule } from './modules/staff/staff.module';
import { ProfileModule } from './modules/profile/profile.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';

// Database configuration
import { DatabaseModule } from './database/database.module';

// Common modules
import { CommonModule } from './common/common.module';
import { PostsModule } from './modules/posts/posts.module';
import { DiscountCodesModule } from './modules/discount-codes/discount-codes.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    DatabaseModule,

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL') || 60000,
          limit: config.get('THROTTLE_LIMIT') || 100,
        },
      ],
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Core modules
    CommonModule,
    AuthModule,
    UsersModule,
    PetsModule,
    ServicesModule,
    ProductsModule,
    CategoriesModule,
    AppointmentsModule,
    OrdersModule,
    PaymentsModule,
    NotificationsModule,
    ReviewsModule,
    CommunityModule,
    SupportModule,
    ConsultationModule,
    WishlistModule,
    StaffModule,
    ProfileModule,
    PostsModule,
    DiscountCodesModule,
    SettingsModule,
    UploadModule,
    ReportsModule,
    ChatbotModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}