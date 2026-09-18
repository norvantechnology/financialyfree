import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationEntity,
  UserConsentEntity,
  NotificationCategory,
  NotificationChannelType,
} from '../../database/entities/notification.entity';
import {
  IMessagingProvider,
  WHATSAPP_PROVIDER,
  EMAIL_PROVIDER,
} from './providers/messaging.provider.interface';
import {
  NotificationDto,
  ConsentPreferencesDto,
  SendNotificationDto,
} from '@ff/types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifRepo: Repository<NotificationEntity>,
    @InjectRepository(UserConsentEntity)
    private readonly consentRepo: Repository<UserConsentEntity>,
    @Inject(WHATSAPP_PROVIDER)
    private readonly whatsappProvider: IMessagingProvider,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: IMessagingProvider,
  ) {}

  async getMyNotifications(userId: string): Promise<{
    notifications: NotificationDto[];
    unreadCount: number;
  }> {
    const list = await this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const unreadCount = await this.notifRepo.count({
      where: { userId, isRead: false },
    });

    return {
      notifications: list.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type as any,
        channel: n.channel as any,
        isRead: n.isRead,
        metadata: n.metadata,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<{ success: boolean }> {
    const notif = await this.notifRepo.findOne({
      where: { id: notificationId, userId },
    });
    if (!notif) {
      throw new NotFoundException('Notification not found');
    }

    notif.isRead = true;
    await this.notifRepo.save(notif);
    return { success: true };
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.notifRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { count: result.affected || 0 };
  }

  async getConsent(userId: string): Promise<ConsentPreferencesDto> {
    let consent = await this.consentRepo.findOne({ where: { userId } });
    if (!consent) {
      consent = this.consentRepo.create({
        userId,
        whatsappTransactional: true,
        whatsappMarketing: false,
        emailAlerts: true,
        emailMarketing: false,
      });
      consent = await this.consentRepo.save(consent);
    }

    return {
      whatsappTransactional: consent.whatsappTransactional,
      whatsappMarketing: consent.whatsappMarketing,
      emailAlerts: consent.emailAlerts,
      emailMarketing: consent.emailMarketing,
      updatedAt: consent.updatedAt?.toISOString(),
      ipAddress: consent.ipAddress,
    };
  }

  async updateConsent(
    userId: string,
    dto: Partial<ConsentPreferencesDto>,
    ipAddress?: string,
  ): Promise<ConsentPreferencesDto> {
    let consent = await this.consentRepo.findOne({ where: { userId } });
    if (!consent) {
      consent = this.consentRepo.create({ userId });
    }

    if (dto.whatsappTransactional !== undefined) {
      consent.whatsappTransactional = dto.whatsappTransactional;
    }
    if (dto.whatsappMarketing !== undefined) {
      consent.whatsappMarketing = dto.whatsappMarketing;
    }
    if (dto.emailAlerts !== undefined) {
      consent.emailAlerts = dto.emailAlerts;
    }
    if (dto.emailMarketing !== undefined) {
      consent.emailMarketing = dto.emailMarketing;
    }
    if (ipAddress) {
      consent.ipAddress = ipAddress;
    }

    const saved = await this.consentRepo.save(consent);
    this.logger.log(`Updated DPDP preferences for user ${userId} from IP ${ipAddress || 'unknown'}`);

    return {
      whatsappTransactional: saved.whatsappTransactional,
      whatsappMarketing: saved.whatsappMarketing,
      emailAlerts: saved.emailAlerts,
      emailMarketing: saved.emailMarketing,
      updatedAt: saved.updatedAt.toISOString(),
      ipAddress: saved.ipAddress,
    };
  }

  async sendNotification(
    userId: string,
    dto: SendNotificationDto,
    recipientContact?: { phone?: string; email?: string },
  ): Promise<NotificationDto> {
    // 1. Create In-App Notification Record
    const notif = this.notifRepo.create({
      userId,
      type: (dto.type as any) || NotificationCategory.GENERAL,
      channel: (dto.channel as any) || NotificationChannelType.IN_APP,
      title: dto.title,
      message: dto.message,
      metadata: dto.metadata,
      isRead: false,
    });

    const saved = await this.notifRepo.save(notif);

    // 2. Fetch DPDP consent
    const consent = await this.getConsent(userId);

    // 3. Dispatch to WhatsApp if requested and consented
    if (
      (dto.channel === 'whatsapp' || dto.channel === 'push') &&
      recipientContact?.phone &&
      consent.whatsappTransactional
    ) {
      await this.whatsappProvider.sendMessage({
        recipient: recipientContact.phone,
        templateId: dto.templateId,
        body: `${dto.title}: ${dto.message}`,
        variables: dto.variables,
      });
    }

    // 4. Dispatch to Email if requested and consented
    if (
      (dto.channel === 'email' || dto.channel === 'push') &&
      recipientContact?.email &&
      consent.emailAlerts
    ) {
      await this.emailProvider.sendMessage({
        recipient: recipientContact.email,
        subject: dto.title,
        body: dto.message,
        variables: dto.variables,
      });
    }

    return {
      id: saved.id,
      userId: saved.userId,
      title: saved.title,
      message: saved.message,
      type: saved.type as any,
      channel: saved.channel as any,
      isRead: saved.isRead,
      metadata: saved.metadata,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async simulateTrigger(userId: string, triggerType: string): Promise<NotificationDto> {
    let title = 'General Update';
    let message = 'Your GoalCompass account has been updated.';
    let category = NotificationCategory.GENERAL;

    switch (triggerType) {
      case 'sip_reminder':
        title = 'SIP Installment Due in 3 Days';
        message = 'Your scheduled monthly SIP of ₹10,000 for "Retirement 2045" will be debited on 10th. Kindly maintain sufficient bank balance.';
        category = NotificationCategory.SIP_REMINDER;
        break;
      case 'kyc_status':
        title = 'KRA KYC Verification Approved';
        message = 'Your CAMS/CVL KRA verification is approved! BSE StAR MF Client UCC UCC_89124 has been activated.';
        category = NotificationCategory.KYC_STATUS;
        break;
      case 'course_progress':
        title = 'Course Module Completed! 🚀';
        message = 'You completed Module 2: Technical Timing & VCP Patterns. Ready to take the 5-question module certification quiz?';
        category = NotificationCategory.COURSE_PROGRESS;
        break;
    }

    return this.sendNotification(
      userId,
      {
        userId,
        title,
        message,
        type: category as any,
        channel: 'in_app' as any,
      },
    );
  }

  /**
   * Public marketing contact form - routes through existing EMAIL_PROVIDER
   * (EmailMockProvider in non-prod; swap provider for live SES/SendGrid).
   */
  async submitContactForm(input: {
    name: string;
    email: string;
    topic: string;
    message: string;
  }): Promise<{ success: boolean; messageId: string }> {
    const supportInbox =
      process.env.CONTACT_INBOX_EMAIL ||
      process.env.SUPPORT_EMAIL ||
      'support@goalcompass.in';

    const result = await this.emailProvider.sendMessage({
      recipient: supportInbox,
      subject: `[Contact/${input.topic}] ${input.name} <${input.email}>`,
      body: [
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        `Topic: ${input.topic}`,
        '',
        input.message,
      ].join('\n'),
      metadata: { source: 'marketing_contact_form', replyTo: input.email },
    });

    this.logger.log(`Contact form queued via EMAIL_PROVIDER → ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  }
}
