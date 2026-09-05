import { Injectable, Logger } from '@nestjs/common';
import {
  IMessagingProvider,
  SendMessagePayload,
  SendMessageResult,
} from './messaging.provider.interface';

@Injectable()
export class WhatsAppMockProvider implements IMessagingProvider {
  private readonly logger = new Logger(WhatsAppMockProvider.name);

  constructor() {
    this.logger.log('✨ Initialized WhatsAppMockProvider (simulated Gupshup/Twilio messaging)');
  }

  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResult> {
    const messageId = `wa_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.logger.log(
      `[Mock WhatsApp] Sent to ${payload.recipient} | Template: ${payload.templateId || 'N/A'}: ${payload.body.substring(0, 80)}... (ID: ${messageId})`,
    );

    return {
      messageId,
      status: 'sent',
      provider: 'Gupshup-Mock',
      timestamp: new Date().toISOString(),
    };
  }
}
