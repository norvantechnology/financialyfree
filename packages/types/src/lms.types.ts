import { UUID, ISO8601 } from './common.types';

export type LessonType = 'video' | 'text' | 'quiz';

export interface CourseDto {
  id: UUID;
  title: string;
  description: string;
  thumbnailUrl?: string;
  totalDuration: number; // minutes
  lessonCount: number;
  isPublished: boolean;
  createdAt: ISO8601;
}

export interface CourseModuleDto {
  id: UUID;
  courseId: UUID;
  title: string;
  order: number;
  lessons: LessonDto[];
}

export interface LessonDto {
  id: UUID;
  moduleId: UUID;
  title: string;
  type: LessonType;
  duration?: number; // minutes for video lessons
  order: number;
  isPreview: boolean; // free preview before purchase
}

export interface EnrollmentDto {
  id: UUID;
  userId: UUID;
  courseId: UUID;
  enrolledAt: ISO8601;
  completedAt?: ISO8601;
  progressPct: number; // 0–100
  certificateId?: UUID;
}

export interface LessonProgressDto {
  userId: UUID;
  lessonId: UUID;
  isCompleted: boolean;
  watchedSeconds?: number;
  completedAt?: ISO8601;
}

export interface VideoPlaybackTokenDto {
  lessonId: UUID;
  playbackUrl: string;
  token: string;
  expiresAt: ISO8601;
}

export interface CertificateDto {
  id: UUID;
  userId: UUID;
  courseId: UUID;
  courseTitle: string;
  userName: string;
  issuedAt: ISO8601;
  certificateUrl: string;
}
