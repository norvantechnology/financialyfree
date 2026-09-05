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
import { GoalType, RiskBand } from '@ff/types';

@Entity('goals')
export class GoalEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 50 })
  type!: GoalType;

  @Column({ length: 150 })
  name!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  targetAmount!: number;

  @Column({ type: 'int', nullable: true })
  targetYear?: number | null;

  @Column({ type: 'int' })
  horizonYears!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  currentSavings!: number;

  @Column({ type: 'varchar', length: 20, default: 'balanced' })
  riskBand!: RiskBand;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 12 })
  expectedReturnPct!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 6 })
  inflationPct!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  monthlySipRequired!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  projectedCorpus!: number;

  @Column({ type: 'jsonb', nullable: true })
  assumptions?: Record<string, unknown>;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
