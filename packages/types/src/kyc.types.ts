import { UUID, ISO8601 } from './common.types';

export type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected' | 'on_hold';
export type KraProvider = 'cvl' | 'cams' | 'kfin' | 'ndml';

export interface KycRecordDto {
  id: UUID;
  userId: UUID;
  pan: string; // stored encrypted in DB, shown masked in API
  panMasked: string; // e.g. "ABCDE1234F" → "XXXXX1234F"
  status: KycStatus;
  kraProvider?: KraProvider;
  verifiedAt?: ISO8601;
  rejectionReason?: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface InitiateKycDto {
  pan: string;
  dateOfBirth: string; // DD-MM-YYYY
  aadhaarLast4?: string; // optional for e-KYC
}

export interface KycStatusResponseDto {
  status: KycStatus;
  message: string;
  kraProvider?: KraProvider;
  verifiedAt?: ISO8601;
  nextStep?: string; // human-readable next action for user
}
