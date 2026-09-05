import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration 001: PostgreSQL extensions
 * Installs uuid-ossp, pg_trgm (for fuzzy company search), and timescaledb.
 * Run once at DB init; safe to run multiple times due to IF NOT EXISTS.
 */
export class Extensions1725000000001 implements MigrationInterface {
  name = 'Extensions1725000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    // TimescaleDB (optional — gracefully skips if not pre-installed in postgres image)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'timescaledb extension not available, skipping.';
      END $$;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Note: dropping extensions is intentionally a no-op in down migrations
    // to prevent accidental data loss in production.
  }
}
