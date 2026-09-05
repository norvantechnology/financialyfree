import { UUID, ISO8601 } from './common.types';

export interface WebinarDto {
  id: UUID;
  title: string;
  description: string;
  topic?: string; // e.g. "Q2 FY26 - Result analysis"
  scheduledAt: ISO8601;
  durationMinutes: number;
  instructorName: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  thumbnailUrl?: string;
  replayUrl?: string; // populated post-session
  linkedCompanies?: string[]; // company names/symbols discussed
}

export interface WebinarRegistrationDto {
  id: UUID;
  userId: UUID;
  webinarId: UUID;
  registeredAt: ISO8601;
  joinUrl?: string; // issued close to session time
  attended: boolean;
}
