export type NotificationChannel = 'in_app' | 'email' | 'whatsapp' | 'sms' | 'push';

export type NotificationType =
  | 'sip_reminder'
  | 'webinar_reminder'
  | 'course_progress'
  | 'kyc_status'
  | 'payment_success'
  | 'payment_failed'
  | 'general';

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SendNotificationDto {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  templateId?: string;
  variables?: Record<string, string | number>;
  metadata?: Record<string, any>;
}

export interface ConsentPreferencesDto {
  whatsappTransactional: boolean;
  whatsappMarketing: boolean;
  emailAlerts: boolean;
  emailMarketing: boolean;
  updatedAt?: string;
  ipAddress?: string;
}

export interface UserConsentDto {
  userId: string;
  channel: NotificationChannel;
  hasConsented: boolean;
  consentedAt?: string;
  revokedAt?: string;
}

export interface SimulateNotificationDto {
  triggerType: 'sip_reminder' | 'webinar_reminder' | 'kyc_status' | 'course_progress';
}
