import { UUID, ISO8601 } from './common.types';

export type WebinarTierType = 'FREE' | 'PRO' | 'ELITE';
export type WebinarStatusType = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface WebinarDto {
  id: UUID;
  title: string;
  slug: string;
  description: string;
  topic?: string; // e.g. "Q2 FY26 - Result analysis"
  scheduledAt: ISO8601;
  durationMinutes: number;
  instructorName: string;
  instructorBio?: string;
  status: WebinarStatusType;
  thumbnailUrl?: string;
  meetingUrl?: string;
  replayUrl?: string; // populated post-session
  tierRequired: WebinarTierType;
  maxAttendees?: number;
  linkedCompanies?: string[]; // company names/symbols discussed
  isRegistered?: boolean;
  userJoinUrl?: string;
}

export interface WebinarRegistrationDto {
  id: UUID;
  userId: UUID;
  webinarId: UUID;
  registeredAt: ISO8601;
  joinUrl?: string; // issued close to session time
  attended: boolean;
  attendedMinutes?: number;
}

export interface WebinarAttendanceWebhookDto {
  webinarId: UUID;
  userId: UUID;
  attendedMinutes: number;
  completedAt?: ISO8601;
}
