import { Injectable, Logger } from '@nestjs/common';
import {
  IKycProvider,
  KraVerificationResult,
  DigiLockerInitiateResult,
} from './kyc.interface';

@Injectable()
export class KycMockProvider implements IKycProvider {
  private readonly logger = new Logger(KycMockProvider.name);

  constructor() {
    this.logger.log('✨ Initialized KycMockProvider (simulated KRA / DigiLocker verification)');
  }

  async verifyPanKra(pan: string, _dateOfBirth?: string): Promise<KraVerificationResult> {
    this.logger.log(`[Mock KYC] Verifying PAN ${pan} against CVL/CAMS KRA...`);

    // In mock mode: valid PAN format passes with CVL KRA verified
    const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());

    if (!isPanValid) {
      return {
        isVerified: false,
        status: 'rejected',
        kraProvider: 'cvl',
        pan,
        verifiedAt: new Date().toISOString(),
        message: 'Invalid PAN format according to Income Tax Department validation rules',
      };
    }

    return {
      isVerified: true,
      status: 'verified',
      kraProvider: 'cvl',
      pan: pan.toUpperCase(),
      name: 'INVESTOR VERIFIED',
      verifiedAt: new Date().toISOString(),
      message: 'KYC Verified (CVL KRA) — Investor eligible for Mutual Fund execution',
    };
  }

  async initiateDigiLocker(userId: string): Promise<DigiLockerInitiateResult> {
    const requestId = `digi_req_${Date.now()}_${userId.slice(0, 8)}`;
    return {
      requestId,
      authUrl: `https://digilocker.mock.gov.in/oauth?request_id=${requestId}`,
      expiresInSeconds: 900,
    };
  }
}
