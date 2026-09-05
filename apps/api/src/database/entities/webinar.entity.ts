import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

export enum WebinarStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WebinarTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ELITE = 'ELITE',
}

@Entity('webinars')
export class WebinarEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  title!: string;

  @Index({ unique: true })
  @Column({ length: 150 })
  slug!: string;

  @Column('text')
  description!: string;

  @Column({ length: 200, nullable: true })
  topic?: string;

  @Column({ type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ type: 'int', default: 60 })
  durationMinutes!: number;

  @Column({ length: 150, default: 'Sandeep Kumar (CMT, CFA)' })
  instructorName!: string;

  @Column('text', { nullable: true })
  instructorBio?: string;

  @Column({
    type: 'enum',
    enum: WebinarStatus,
    default: WebinarStatus.SCHEDULED,
  })
  status!: WebinarStatus;

  @Column({ length: 500, nullable: true })
  thumbnailUrl?: string;

  @Column({ length: 500, nullable: true })
  meetingUrl?: string;

  @Column({ length: 500, nullable: true })
  replayUrl?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: WebinarTier.FREE,
  })
  tierRequired!: WebinarTier;

  @Column({ type: 'int', default: 500 })
  maxAttendees!: number;

  @Column('jsonb', { default: () => "'[]'" })
  linkedCompanies!: string[];

  @OneToMany(() => WebinarRegistrationEntity, (reg) => reg.webinar)
  registrations!: WebinarRegistrationEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity('webinar_registrations')
@Index(['webinarId', 'userId'], { unique: true })
export class WebinarRegistrationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  webinarId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => WebinarEntity, (w) => w.registrations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'webinarId' })
  webinar!: WebinarEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  registeredAt!: Date;

  @Column({ length: 500 })
  joinUrl!: string;

  @Column({ type: 'boolean', default: false })
  attended!: boolean;

  @Column({ type: 'int', default: 0 })
  attendedMinutes!: number;
}
