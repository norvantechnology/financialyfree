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
import { OptionType, TradeSide } from '@ff/types';
import { UserEntity } from './user.entity';

@Entity('sandbox_positions')
@Index(['userId', 'status'])
export class SandboxPositionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ type: 'varchar', length: 64 })
  symbol!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  strike?: number | null;

  @Column({ name: 'option_type', type: 'varchar', length: 8 })
  optionType!: OptionType | 'FUT';

  @Column({ type: 'date' })
  expiry!: string;

  @Column({ type: 'varchar', length: 8 })
  side!: TradeSide;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ name: 'lot_size', type: 'integer', default: 1 })
  lotSize!: number;

  @Column({ name: 'entry_price', type: 'numeric', precision: 12, scale: 2 })
  entryPrice!: number;

  @Column({ name: 'current_price', type: 'numeric', precision: 12, scale: 2 })
  currentPrice!: number;

  @Column({ name: 'unrealized_pnl', type: 'numeric', precision: 14, scale: 2, default: 0 })
  unrealizedPnl!: number;

  @Column({ name: 'realized_pnl', type: 'numeric', precision: 14, scale: 2, default: 0 })
  realizedPnl!: number;

  @Column({ type: 'varchar', length: 16, default: 'OPEN' })
  status!: 'OPEN' | 'CLOSED';

  @CreateDateColumn({ name: 'entry_at', type: 'timestamptz' })
  entryAt!: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt?: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
