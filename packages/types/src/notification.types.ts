export type NotificationChannel = 'in_app' | 'email' | 'whatsapp' | 'sms' | 'push';
export type NotificationType =
  | 'sip_reminder'
  | 'webinar_reminder'
  | 'course_progress'
  | 'kyc_status'
  | 'payment_success'
  | 'payment_failed'
  | 'general';

export interface SendNotificationDto {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  templateId: string;
  variables: Record<string, string | number>;
}

export interface UserConsentDto {
  userId: string;
  channel: NotificationChannel;
  hasConsented: boolean;
  consentedAt?: string;
  revokedAt?: string;
}
