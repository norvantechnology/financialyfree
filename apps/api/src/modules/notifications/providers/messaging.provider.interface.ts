export interface SendMessagePayload {
  recipient: string; // phone number (+91...) or email address
  templateId?: string;
  subject?: string;
  body: string;
  variables?: Record<string, string | number>;
  metadata?: Record<string, any>;
}

export interface SendMessageResult {
  messageId: string;
  status: 'sent' | 'queued' | 'delivered' | 'failed';
  provider: string;
  timestamp: string;
}

export interface IMessagingProvider {
  sendMessage(payload: SendMessagePayload): Promise<SendMessageResult>;
}

export const WHATSAPP_PROVIDER = 'WHATSAPP_PROVIDER';
export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';
