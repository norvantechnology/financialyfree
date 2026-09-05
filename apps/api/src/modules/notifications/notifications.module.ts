import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NotificationEntity,
  UserConsentEntity,
} from '../../database/entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import {
  WHATSAPP_PROVIDER,
  EMAIL_PROVIDER,
} from './providers/messaging.provider.interface';
import { WhatsAppMockProvider } from './providers/whatsapp.mock.provider';
import { EmailMockProvider } from './providers/email.mock.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, UserConsentEntity]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: WHATSAPP_PROVIDER,
      useClass: WhatsAppMockProvider,
    },
    {
      provide: EMAIL_PROVIDER,
      useClass: EmailMockProvider,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
