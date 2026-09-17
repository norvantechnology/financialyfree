import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BrokerType, BrokerConnectionStatus } from '@ff/types';
import { UserEntity } from './user.entity';

@Entity('broker_connections')
@Index(['userId', 'broker'], { unique: true })
export class BrokerConnectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ type: 'varchar', length: 32 })
  broker!: BrokerType;

  @Column({ name: 'broker_client_id', type: 'varchar', length: 128, default: '' })
  brokerClientId!: string;

  @Column({ name: 'encrypted_access_token', type: 'text' })
  encryptedAccessToken!: string;

  @Column({ name: 'encrypted_refresh_token', type: 'text', nullable: true })
  encryptedRefreshToken?: string | null;

  @Column({ name: 'status', type: 'varchar', length: 32, default: 'connected' })
  status!: BrokerConnectionStatus;

  @Column({ name: 'token_expires_at', type: 'timestamptz', nullable: true })
  tokenExpiresAt?: Date | null;

  @Column({ name: 'last_connected_at', type: 'timestamptz', nullable: true })
  lastConnectedAt?: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
