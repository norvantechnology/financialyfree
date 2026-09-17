import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';
import { OptionType } from '@ff/types';

@Entity('oi_snapshots')
@Index(['symbol', 'expiry', 'strike', 'timestamp'])
@Index(['symbol', 'timestamp'])
export class OiSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  symbol!: string;

  @Column({ type: 'date' })
  expiry!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  strike!: number;

  @Column({ name: 'option_type', type: 'varchar', length: 8 })
  optionType!: OptionType;

  @Column({ type: 'bigint', default: 0 })
  oi!: string;

  @Column({ name: 'oi_change', type: 'bigint', default: 0 })
  oiChange!: string;

  @Column({ type: 'bigint', default: 0 })
  volume!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  ltp!: number;

  @Column({ type: 'numeric', precision: 8, scale: 4, nullable: true })
  iv?: number | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  timestamp!: Date;
}
