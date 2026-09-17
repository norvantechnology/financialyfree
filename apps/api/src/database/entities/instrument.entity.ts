import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ExchangeType, InstrumentSegment, OptionType } from '@ff/types';

@Entity('instruments')
@Index(['symbol', 'expiry', 'strike', 'optionType'])
@Index(['symbol', 'segment'])
export class InstrumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'instrument_token', type: 'varchar', length: 64 })
  @Index({ unique: true })
  instrumentToken!: string;

  @Column({ type: 'varchar', length: 16 })
  exchange!: ExchangeType;

  @Column({ type: 'varchar', length: 16 })
  segment!: InstrumentSegment;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  symbol!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'date', nullable: true })
  @Index()
  expiry?: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  strike?: number | null;

  @Column({ name: 'option_type', type: 'varchar', length: 8, nullable: true })
  optionType?: OptionType | null;

  @Column({ name: 'lot_size', type: 'integer', default: 1 })
  lotSize!: number;

  @Column({ name: 'tick_size', type: 'numeric', precision: 8, scale: 4, default: 0.05 })
  tickSize!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
