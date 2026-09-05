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
import {
  SubscriptionStatus,
  SkuType,
  PaymentOrderStatus,
} from '@ff/types';

@Entity('plans')
export class PlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 50 })
  slug!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number; // in INR

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice?: number;

  @Column({ type: 'int', nullable: true })
  durationMonths?: number | null; // null = lifetime

  @Column({ type: 'text', array: true })
  skus!: SkuType[];

  @Column({ type: 'text', array: true, default: '{}' })
  features!: string[];

  @Column({ default: false })
  isPopular!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('subscriptions')
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Index()
  @Column({ type: 'uuid' })
  planId!: string;

  @ManyToOne(() => PlanEntity)
  @JoinColumn({ name: 'planId' })
  plan!: PlanEntity;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status!: SubscriptionStatus;

  @Column({ type: 'timestamptz' })
  startedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @Column({ length: 100, nullable: true })
  razorpaySubscriptionId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity('entitlements')
export class EntitlementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 50 })
  sku!: SkuType;

  @Column({ default: false })
  isLifetime!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @Column({ type: 'timestamptz' })
  grantedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  sourceSubscriptionId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('payment_orders')
export class PaymentOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'uuid' })
  planId!: string;

  @ManyToOne(() => PlanEntity)
  @JoinColumn({ name: 'planId' })
  plan!: PlanEntity;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  gstAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({ length: 10, default: 'INR' })
  currency!: string;

  @Column({ type: 'varchar', length: 20, default: 'created' })
  status!: PaymentOrderStatus;

  @Index({ unique: true })
  @Column({ length: 100 })
  razorpayOrderId!: string;

  @Column({ length: 100, nullable: true })
  razorpayPaymentId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => PaymentOrderEntity)
  @JoinColumn({ name: 'orderId' })
  order!: PaymentOrderEntity;

  @Index({ unique: true })
  @Column({ length: 100 })
  razorpayPaymentId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ length: 10, default: 'INR' })
  currency!: string;

  @Column({ length: 50, nullable: true })
  method?: string;

  @Column({ length: 20, default: 'captured' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  errorDescription?: string;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
