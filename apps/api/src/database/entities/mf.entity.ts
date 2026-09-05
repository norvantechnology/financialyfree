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
import { GoalEntity } from './goal.entity';
import { OrderType, OrderStatus } from '@ff/types';

@Entity('mf_schemes')
export class MfSchemeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ length: 30 })
  schemeCode!: string; // AMFI code

  @Column({ length: 255 })
  schemeName!: string;

  @Column({ length: 150 })
  amcName!: string;

  @Column({ length: 50 })
  category!: string; // e.g. Equity - Large Cap, Flexi Cap, Debt - Liquid

  @Column({ length: 50, default: 'Growth' })
  subCategory!: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  navCurrent!: number;

  @Column({ type: 'date' })
  navDate!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.5 })
  expenseRatio!: number;

  @Column({ length: 150, default: 'Nil' })
  exitLoad!: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  returns1yr?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  returns3yr?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  returns5yr?: number;

  @Column({ length: 30, default: 'very_high' })
  riskLevel!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 500 })
  minSipAmount!: number;

  @Column({ default: true })
  isRecommended!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('mf_orders')
export class MfOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  goalId?: string | null;

  @ManyToOne(() => GoalEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'goalId' })
  goal?: GoalEntity | null;

  @Column({ length: 30 })
  schemeCode!: string;

  @ManyToOne(() => MfSchemeEntity)
  @JoinColumn({ name: 'schemeCode', referencedColumnName: 'schemeCode' })
  scheme?: MfSchemeEntity;

  @Column({ type: 'varchar', length: 20, default: 'sip' })
  orderType!: OrderType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'int', default: 10 })
  sipDayOfMonth!: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: OrderStatus;

  @Column({ length: 50, nullable: true })
  bseOrderNo?: string;

  @Column({ length: 50, nullable: true })
  bseRegistrationNo?: string;

  @Column({ length: 50, nullable: true })
  folioNumber?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  placedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  settledAt?: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  unitsAllotted?: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity('mf_folios')
export class MfFolioEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ length: 50 })
  folioNumber!: string;

  @Column({ length: 150 })
  amcName!: string;

  @Column({ length: 30 })
  schemeCode!: string;

  @Column({ length: 255 })
  schemeName!: string;

  @Column({ type: 'decimal', precision: 14, scale: 4, default: 0 })
  units!: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  navCurrent!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  investedAmount!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  currentValue!: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  xirr!: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastUpdated!: Date;
}

@Entity('mf_nav_history')
export class MfNavHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ length: 30 })
  schemeCode!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  nav!: number;

  @Column({ type: 'date' })
  navDate!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  recordedAt!: Date;
}

