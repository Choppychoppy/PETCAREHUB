import { Module, Global } from '@nestjs/common';
import { UploadService } from './services/upload.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';

@Global()
@Module({
  providers: [
    UploadService,
    EmailService,
    SmsService,
  ],
  exports: [
    UploadService,
    EmailService,
    SmsService,
  ],
})
export class CommonModule {}