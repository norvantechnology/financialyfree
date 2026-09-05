import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { KycStatus, KraProvider } from '@ff/types';

@Entity('kyc_records')
export class KycEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId!: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ length: 10 })
  pan!: string; // Stored securely/hashed/encrypted

  @Column({ length: 10 })
  panMasked!: string; // e.g. ABCDE1234F -> XXXXX1234F

  @Column({ length: 10, nullable: true })
  dateOfBirth?: string; // DD-MM-YYYY

  @Column({ length: 4, nullable: true })
  aadhaarLast4?: string;

  @Column({ type: 'varchar', length: 20, default: 'not_started' })
  status!: KycStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  kraProvider?: KraProvider;

  @Column({ length: 50, nullable: true })
  ucc?: string; // BSE StAR MF Unique Client Code

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
