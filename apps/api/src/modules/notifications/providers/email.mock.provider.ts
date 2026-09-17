import { Injectable, Logger } from '@nestjs/common';
import {
  IMessagingProvider,
  SendMessagePayload,
  SendMessageResult,
} from './messaging.provider.interface';

@Injectable()
export class EmailMockProvider implements IMessagingProvider {
  private readonly logger = new Logger(EmailMockProvider.name);

  constructor() {
    this.logger.log('✨ Initialized EmailMockProvider (simulated AWS SES/SendGrid)');
  }

  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResult> {
    const messageId = `email_ses_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.logger.log(
      `[Mock Email] Sent to ${payload.recipient} | Subject: "${payload.subject || 'GoalCompass Alert'}": ${payload.body.substring(0, 80)}... (ID: ${messageId})`,
    );

    return {
      messageId,
      status: 'sent',
      provider: 'AWS-SES-Mock',
      timestamp: new Date().toISOString(),
    };
  }
}
