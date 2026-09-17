import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptionsModule1726500000015 implements MigrationInterface {
  name = 'OptionsModule1726500000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. broker_connections table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "broker_connections" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "broker" varchar(32) NOT NULL,
        "broker_client_id" varchar(128) NOT NULL DEFAULT '',
        "encrypted_access_token" text NOT NULL,
        "encrypted_refresh_token" text,
        "status" varchar(32) NOT NULL DEFAULT 'connected',
        "token_expires_at" timestamptz,
        "last_connected_at" timestamptz,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb DEFAULT '{}',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_broker_connections_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_broker_connections_user_broker" UNIQUE ("user_id", "broker")
      );
      CREATE INDEX IF NOT EXISTS "idx_broker_connections_user_id" ON "broker_connections"("user_id");
    `);

    // 2. instruments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "instruments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "instrument_token" varchar(64) NOT NULL,
        "exchange" varchar(16) NOT NULL,
        "segment" varchar(16) NOT NULL,
        "symbol" varchar(64) NOT NULL,
        "name" varchar(255) NOT NULL,
        "expiry" date,
        "strike" numeric(12, 2),
        "option_type" varchar(8),
        "lot_size" integer NOT NULL DEFAULT 1,
        "tick_size" numeric(8, 4) NOT NULL DEFAULT 0.05,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_instruments_token" UNIQUE ("instrument_token")
      );
      CREATE INDEX IF NOT EXISTS "idx_instruments_symbol_expiry_strike_type" ON "instruments"("symbol", "expiry", "strike", "option_type");
      CREATE INDEX IF NOT EXISTS "idx_instruments_symbol_segment" ON "instruments"("symbol", "segment");
      CREATE INDEX IF NOT EXISTS "idx_instruments_symbol" ON "instruments"("symbol");
    `);

    // 3. oi_snapshots table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "oi_snapshots" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "symbol" varchar(64) NOT NULL,
        "expiry" date NOT NULL,
        "strike" numeric(12, 2) NOT NULL,
        "option_type" varchar(8) NOT NULL,
        "oi" bigint NOT NULL DEFAULT 0,
        "oi_change" bigint NOT NULL DEFAULT 0,
        "volume" bigint NOT NULL DEFAULT 0,
        "ltp" numeric(12, 2) NOT NULL DEFAULT 0,
        "iv" numeric(8, 4),
        "timestamp" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "idx_oi_snapshots_symbol_expiry_strike_ts" ON "oi_snapshots"("symbol", "expiry", "strike", "timestamp" DESC);
      CREATE INDEX IF NOT EXISTS "idx_oi_snapshots_symbol_ts" ON "oi_snapshots"("symbol", "timestamp" DESC);
    `);

    // Check if TimescaleDB extension is available; if so, convert oi_snapshots to hypertable
    try {
      const timescaleExt = await queryRunner.query(`
        SELECT 1 FROM pg_extension WHERE extname = 'timescaledb';
      `);
      if (timescaleExt && timescaleExt.length > 0) {
        await queryRunner.query(`
          SELECT create_hypertable('oi_snapshots', 'timestamp', if_not_exists => TRUE, migrate_data => TRUE);
        `);
      }
    } catch {
      // Gracefully continue with standard indexed PostgreSQL table
    }

    // 4. saved_strategies table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "saved_strategies" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "name" varchar(128) NOT NULL,
        "underlying" varchar(64) NOT NULL,
        "legs" jsonb NOT NULL DEFAULT '[]',
        "notes" text,
        "tags" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_saved_strategies_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "idx_saved_strategies_user_id" ON "saved_strategies"("user_id");
      CREATE INDEX IF NOT EXISTS "idx_saved_strategies_underlying" ON "saved_strategies"("underlying");
    `);

    // 5. sandbox_positions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sandbox_positions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "symbol" varchar(64) NOT NULL,
        "strike" numeric(12, 2),
        "option_type" varchar(8) NOT NULL,
        "expiry" date NOT NULL,
        "side" varchar(8) NOT NULL,
        "quantity" integer NOT NULL,
        "lot_size" integer NOT NULL DEFAULT 1,
        "entry_price" numeric(12, 2) NOT NULL,
        "current_price" numeric(12, 2) NOT NULL,
        "unrealized_pnl" numeric(14, 2) NOT NULL DEFAULT 0,
        "realized_pnl" numeric(14, 2) NOT NULL DEFAULT 0,
        "status" varchar(16) NOT NULL DEFAULT 'OPEN',
        "entry_at" timestamptz NOT NULL DEFAULT now(),
        "closed_at" timestamptz,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_sandbox_positions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "idx_sandbox_positions_user_status" ON "sandbox_positions"("user_id", "status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sandbox_positions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "saved_strategies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "oi_snapshots" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "instruments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "broker_connections" CASCADE`);
  }
}
