import { UUID, ISO8601 } from './common.types';
export interface WebinarDto {
    id: UUID;
    title: string;
    description: string;
    topic?: string;
    scheduledAt: ISO8601;
    durationMinutes: number;
    instructorName: string;
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    thumbnailUrl?: string;
    replayUrl?: string;
    linkedCompanies?: string[];
}
export interface WebinarRegistrationDto {
    id: UUID;
    userId: UUID;
    webinarId: UUID;
    registeredAt: ISO8601;
    joinUrl?: string;
    attended: boolean;
}
//# sourceMappingURL=webinar.types.d.ts.map