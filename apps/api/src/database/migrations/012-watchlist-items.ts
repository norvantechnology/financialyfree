import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatchlistItems1725000000012 implements MigrationInterface {
  name = 'WatchlistItems1725000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "watchlist_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "symbol" varchar(32) NOT NULL,
        "companyName" varchar(128),
        "alertPriceAbove" decimal(12,2),
        "alertPriceBelow" decimal(12,2),
        "addedAt" timestamptz NOT NULL DEFAULT now(),
        "lastTriggeredAt" timestamptz,
        "notes" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_watchlist_user_symbol" UNIQUE ("userId", "symbol")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_watchlist_user" ON "watchlist_items"("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_watchlist_symbol" ON "watchlist_items"("symbol")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "watchlist_items" CASCADE`);
  }
}
