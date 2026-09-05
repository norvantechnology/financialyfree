import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type DataSourceMode =
  | 'LIVE_FETCH'
  | 'COMPUTED_FROM_LIVE'
  | 'STATIC_SEED'
  | 'MOCK_PROVIDER';

export type DataSourceStatus = 'SUCCESS' | 'FAILURE';

@Entity('data_source_health')
export class DataSourceHealthEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  sourceKey!: string;

  @Column({ type: 'varchar', length: 128 })
  sourceName!: string;

  @Column({ type: 'varchar', length: 32 })
  mode!: DataSourceMode;

  @Column({ type: 'varchar', length: 16, default: 'SUCCESS' })
  status!: DataSourceStatus;

  @Column({ type: 'varchar', length: 512 })
  upstreamRef!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastFetchedAt!: Date;

  @Column({ type: 'integer', default: 0 })
  durationMs!: number;

  @Column({ type: 'text' })
  rawResponseSnippet!: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
