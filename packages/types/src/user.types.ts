import { UUID, ISO8601 } from './common.types';

export type UserRole = 'user' | 'admin' | 'distributor';

export interface UserDto {
  id: UUID;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  preferredLanguage: 'en' | 'hi';
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  preferredLanguage?: 'en' | 'hi';
  avatarUrl?: string;
}

export interface UserSessionDto {
  id: UUID;
  userId: UUID;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: ISO8601;
  lastUsedAt: ISO8601;
}
