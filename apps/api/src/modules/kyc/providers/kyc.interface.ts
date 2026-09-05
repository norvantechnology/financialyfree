import { KraProvider, KycStatus } from '@ff/types';

export interface KraVerificationResult {
  isVerified: boolean;
  status: KycStatus;
  kraProvider: KraProvider;
  pan: string;
  name?: string;
  verifiedAt: string;
  message: string;
}

export interface DigiLockerInitiateResult {
  requestId: string;
  authUrl: string;
  expiresInSeconds: number;
}

export interface IKycProvider {
  verifyPanKra(pan: string, dateOfBirth?: string): Promise<KraVerificationResult>;
  initiateDigiLocker(userId: string): Promise<DigiLockerInitiateResult>;
}

export const KYC_PROVIDER = 'KYC_PROVIDER';
