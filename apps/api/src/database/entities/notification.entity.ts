import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

export enum NotificationChannelType {
  IN_APP = 'in_app',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationCategory {
  SIP_REMINDER = 'sip_reminder',
  WEBINAR_REMINDER = 'webinar_reminder',
  COURSE_PROGRESS = 'course_progress',
  KYC_STATUS = 'kyc_status',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  GENERAL = 'general',
}

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
    default: NotificationCategory.GENERAL,
  })
  type!: NotificationCategory;

  @Column({
    type: 'enum',
    enum: NotificationChannelType,
    default: NotificationChannelType.IN_APP,
  })
  channel!: NotificationChannelType;

  @Column({ length: 255 })
  title!: string;

  @Column('text')
  message!: string;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('user_consents')
export class UserConsentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'boolean', default: true })
  whatsappTransactional!: boolean;

  @Column({ type: 'boolean', default: false })
  whatsappMarketing!: boolean;

  @Column({ type: 'boolean', default: true })
  emailAlerts!: boolean;

  @Column({ type: 'boolean', default: false })
  emailMarketing!: boolean;

  @Column({ length: 60, nullable: true })
  ipAddress?: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
